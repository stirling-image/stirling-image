import { useCallback, useState, useRef } from "react";

function getToken(): string {
  return localStorage.getItem("stirling-token") || "";
}

interface BatchProgress {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  currentFile?: string;
  errors: Array<{ filename: string; error: string }>;
  status: "idle" | "uploading" | "processing" | "completed" | "failed";
  /** Percentage 0-100. */
  percent: number;
}

/**
 * Hook for batch processing multiple files with SSE progress tracking.
 *
 * Uploads all files to the batch endpoint, listens for SSE progress events,
 * and triggers a ZIP download when processing completes.
 */
export function useBatchProcessor(toolId: string) {
  const [progress, setProgress] = useState<BatchProgress>({
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    errors: [],
    status: "idle",
    percent: 0,
  });

  const abortRef = useRef<AbortController | null>(null);

  const processBatch = useCallback(
    async (files: File[], settings: Record<string, unknown>) => {
      if (files.length === 0) return;

      // Reset state
      setProgress({
        totalFiles: files.length,
        completedFiles: 0,
        failedFiles: 0,
        errors: [],
        status: "uploading",
        percent: 0,
      });

      abortRef.current = new AbortController();

      try {
        // Build multipart form with all files + settings
        const formData = new FormData();
        for (const file of files) {
          formData.append("files", file);
        }
        formData.append("settings", JSON.stringify(settings));

        setProgress((prev) => ({ ...prev, status: "processing" }));

        const res = await fetch(`/api/v1/tools/${toolId}/batch`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData,
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          // Try to read error body
          const text = await res.text();
          let errorMsg = `Batch processing failed: ${res.status}`;
          try {
            const body = JSON.parse(text);
            errorMsg = body.error || body.details || errorMsg;
          } catch {
            // ignore
          }
          setProgress((prev) => ({
            ...prev,
            status: "failed",
            errors: [{ filename: "", error: errorMsg }],
          }));
          return;
        }

        // Get the Job ID from the response header for SSE
        const jobId = res.headers.get("X-Job-Id");

        // The response IS the ZIP file — trigger download
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `batch-${toolId}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // If we have a jobId, try to get final progress from SSE
        // But since the ZIP response already indicates success, mark as completed
        setProgress((prev) => ({
          ...prev,
          status: "completed",
          completedFiles: files.length,
          percent: 100,
        }));

        // Optionally fetch final progress for error details
        if (jobId) {
          try {
            const progressRes = await fetch(`/api/v1/jobs/${jobId}/progress`, {
              headers: { Authorization: `Bearer ${getToken()}` },
              signal: AbortSignal.timeout(3000),
            });
            // SSE stream — read the last event
            const reader = progressRes.body?.getReader();
            if (reader) {
              const decoder = new TextDecoder();
              let buffer = "";
              let lastData: string | null = null;
              // Read a few chunks to get the final state
              for (let i = 0; i < 5; i++) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    lastData = line.slice(6);
                  }
                }
              }
              reader.cancel();

              if (lastData) {
                const finalProgress = JSON.parse(lastData);
                setProgress((prev) => ({
                  ...prev,
                  failedFiles: finalProgress.failedFiles ?? prev.failedFiles,
                  errors: finalProgress.errors ?? prev.errors,
                  completedFiles:
                    finalProgress.completedFiles ?? prev.completedFiles,
                }));
              }
            }
          } catch {
            // Progress fetch is optional, ignore errors
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setProgress((prev) => ({
          ...prev,
          status: "failed",
          errors: [
            {
              filename: "",
              error: err instanceof Error ? err.message : "Batch processing failed",
            },
          ],
        }));
      }
    },
    [toolId],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setProgress((prev) => ({ ...prev, status: "idle" }));
  }, []);

  const reset = useCallback(() => {
    setProgress({
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
      errors: [],
      status: "idle",
      percent: 0,
    });
  }, []);

  return {
    processBatch,
    cancel,
    reset,
    progress,
  };
}
