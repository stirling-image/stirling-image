import type { FeatureBundleState } from "@ashim/shared";
import { Download, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useFeaturesStore } from "@/stores/features-store";

interface BundleProgress {
  percent: number;
  stage: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function AiFeaturesSection() {
  const { bundles, fetch, refresh } = useFeaturesStore();
  const [installing, setInstalling] = useState<Record<string, BundleProgress>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [diskUsage, setDiskUsage] = useState<number | null>(null);
  const [installAllActive, setInstallAllActive] = useState(false);
  const esRefs = useRef<Record<string, EventSource>>({});
  const pollRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    fetch();
    loadDiskUsage();
    return () => {
      for (const es of Object.values(esRefs.current)) es.close();
      for (const id of Object.values(pollRefs.current)) clearInterval(id);
    };
  }, [fetch]);

  const loadDiskUsage = useCallback(async () => {
    try {
      const data = await apiGet<{ totalBytes: number }>("/v1/admin/features/disk-usage");
      setDiskUsage(data.totalBytes);
    } catch {
      /* ignore */
    }
  }, []);

  const startPolling = useCallback(
    (bundleId: string) => {
      if (pollRefs.current[bundleId]) return;
      pollRefs.current[bundleId] = setInterval(async () => {
        try {
          await refresh();
          const updated = useFeaturesStore.getState().bundles.find((b) => b.id === bundleId);
          if (!updated || updated.status !== "installing") {
            clearInterval(pollRefs.current[bundleId]);
            delete pollRefs.current[bundleId];
            setInstalling((prev) => {
              const next = { ...prev };
              delete next[bundleId];
              return next;
            });
            if (updated?.status === "error") {
              setErrors((prev) => ({
                ...prev,
                [bundleId]: updated.error ?? "Installation failed",
              }));
            }
            loadDiskUsage();
          } else if (updated.progress) {
            setInstalling((prev) => ({ ...prev, [bundleId]: updated.progress! }));
          }
        } catch {
          /* ignore */
        }
      }, 3000);
    },
    [refresh, loadDiskUsage],
  );

  const listenToProgress = useCallback(
    (bundleId: string, jobId: string) => {
      const es = new EventSource(`/api/v1/jobs/${jobId}/progress`);
      esRefs.current[bundleId] = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as {
            phase: string;
            percent: number;
            stage: string;
            error?: string;
          };
          if (data.phase === "complete") {
            es.close();
            delete esRefs.current[bundleId];
            setInstalling((prev) => {
              const next = { ...prev };
              delete next[bundleId];
              return next;
            });
            refresh();
            loadDiskUsage();
            return;
          }
          if (data.phase === "failed") {
            es.close();
            delete esRefs.current[bundleId];
            setInstalling((prev) => {
              const next = { ...prev };
              delete next[bundleId];
              return next;
            });
            setErrors((prev) => ({ ...prev, [bundleId]: data.error ?? "Installation failed" }));
            return;
          }
          setInstalling((prev) => ({
            ...prev,
            [bundleId]: { percent: data.percent, stage: data.stage },
          }));
        } catch {
          /* ignore */
        }
      };

      es.onerror = () => {
        es.close();
        delete esRefs.current[bundleId];
        startPolling(bundleId);
      };
    },
    [refresh, loadDiskUsage, startPolling],
  );

  const installBundle = useCallback(
    async (bundleId: string) => {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[bundleId];
        return next;
      });
      setInstalling((prev) => ({ ...prev, [bundleId]: { percent: 0, stage: "Starting..." } }));

      try {
        const result = await apiPost<{ jobId: string }>(`/v1/admin/features/${bundleId}/install`);
        listenToProgress(bundleId, result.jobId);
      } catch (err) {
        setInstalling((prev) => {
          const next = { ...prev };
          delete next[bundleId];
          return next;
        });
        setErrors((prev) => ({
          ...prev,
          [bundleId]: err instanceof Error ? err.message : "Failed to start installation",
        }));
      }
    },
    [listenToProgress],
  );

  const uninstallBundle = useCallback(
    async (bundleId: string) => {
      try {
        await apiPost(`/v1/admin/features/${bundleId}/uninstall`);
        await refresh();
        loadDiskUsage();
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          [bundleId]: err instanceof Error ? err.message : "Uninstall failed",
        }));
      }
    },
    [refresh, loadDiskUsage],
  );

  const handleInstallAll = useCallback(async () => {
    setInstallAllActive(true);
    const notInstalled = bundles.filter((b) => b.status === "not_installed");
    for (const bundle of notInstalled) {
      await installBundle(bundle.id);
      // Wait for this bundle to finish before starting next
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          const current = useFeaturesStore.getState().bundles.find((b) => b.id === bundle.id);
          if (!current || current.status !== "installing") {
            clearInterval(check);
            resolve();
          }
        }, 2000);
      });
    }
    setInstallAllActive(false);
  }, [bundles, installBundle]);

  const anyInstalling = Object.keys(installing).length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI Features</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage AI model bundles for advanced image processing.
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstallAll}
          disabled={
            anyInstalling || installAllActive || bundles.every((b) => b.status === "installed")
          }
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Install All
        </button>
      </div>

      {/* Bundle cards */}
      <div className="space-y-3">
        {bundles.map((bundle) => (
          <BundleCard
            key={bundle.id}
            bundle={bundle}
            progress={installing[bundle.id] ?? null}
            error={errors[bundle.id] ?? null}
            onInstall={() => installBundle(bundle.id)}
            onUninstall={() => uninstallBundle(bundle.id)}
            isInstalling={!!installing[bundle.id]}
          />
        ))}
      </div>

      {/* Disk usage footer */}
      {diskUsage !== null && (
        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          Disk usage: {formatBytes(diskUsage)}
        </p>
      )}
    </div>
  );
}

function BundleCard({
  bundle,
  progress,
  error,
  onInstall,
  onUninstall,
  isInstalling,
}: {
  bundle: FeatureBundleState;
  progress: BundleProgress | null;
  error: string | null;
  onInstall: () => void;
  onUninstall: () => void;
  isInstalling: boolean;
}) {
  const status = isInstalling ? "installing" : bundle.status;

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{bundle.name}</p>
          <p className="text-xs text-muted-foreground">
            {bundle.description} (~{bundle.estimatedSize})
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {/* Status indicator */}
          <div className="flex items-center gap-1.5">
            {status === "installed" && (
              <>
                <span className="bg-green-500 rounded-full h-2 w-2" />
                <span className="text-xs text-muted-foreground">Installed</span>
              </>
            )}
            {status === "not_installed" && !error && (
              <>
                <span className="bg-muted-foreground rounded-full h-2 w-2" />
                <span className="text-xs text-muted-foreground">Not installed</span>
              </>
            )}
            {status === "installing" && progress && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{progress.percent}%</span>
              </>
            )}
            {(status === "error" || error) && (
              <>
                <span className="bg-destructive rounded-full h-2 w-2" />
                <span className="text-xs text-destructive truncate max-w-[120px]">
                  {error ?? bundle.error}
                </span>
              </>
            )}
          </div>

          {/* Action button */}
          {status === "not_installed" && !error && (
            <button
              type="button"
              onClick={onInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </button>
          )}
          {status === "installed" && (
            <button
              type="button"
              onClick={onUninstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Uninstall
            </button>
          )}
          {status === "installing" && (
            <button
              type="button"
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium opacity-50"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Installing...
            </button>
          )}
          {(status === "error" || error) && !isInstalling && (
            <button
              type="button"
              onClick={onInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
