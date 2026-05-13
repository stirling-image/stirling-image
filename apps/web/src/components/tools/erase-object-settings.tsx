import { Download, Redo, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { ProgressCard } from "@/components/common/progress-card";
import { formatHeaders } from "@/lib/api";
import { generateId } from "@/lib/utils";
import { useFileStore } from "@/stores/file-store";
import type { EraserCanvasRef } from "./eraser-canvas";

const OUTPUT_FORMATS = [
  "png",
  "jpg",
  "webp",
  "avif",
  "tiff",
  "gif",
  "heic",
  "heif",
  "jxl",
] as const;
const LOSSY_FORMATS = ["jpg", "jpeg", "webp", "avif", "heic", "heif", "jxl"];

interface EraseObjectSettingsProps {
  eraserRef: React.RefObject<EraserCanvasRef | null>;
  hasStrokes: boolean;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onMaskCenter?: (centerPct: number) => void;
  maskedFileCount: number;
}

export function EraseObjectSettings({
  eraserRef,
  hasStrokes,
  brushSize,
  onBrushSizeChange: setBrushSize,
  onMaskCenter,
  maskedFileCount,
}: EraseObjectSettingsProps) {
  const {
    files,
    entries,
    selectedIndex,
    processing,
    error,
    setProcessing,
    setError,
    currentEntry,
  } = useFileStore();
  const [progressPhase, setProgressPhase] = useState<"idle" | "uploading" | "processing">("idle");
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStage, setProgressStage] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [outputFormat, setOutputFormat] = useState("png");
  const [quality, setQuality] = useState(95);

  const processOneFile = (
    entryIndex: number,
    file: File,
    maskBlob: Blob,
    onProgress: (percent: number) => void,
  ): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const clientJobId = generateId();
      let asyncMode = false;

      const es = new EventSource(`/api/v1/jobs/${clientJobId}/progress`);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== "single") return;
          if (data.phase === "complete" && data.result) {
            es.close();
            const r = data.result;
            useFileStore.getState().updateEntry(entryIndex, {
              processedUrl: r.downloadUrl,
              processedPreviewUrl: r.previewUrl ?? null,
              processedFilename: null,
              status: "completed",
              originalSize: r.originalSize,
              processedSize: r.processedSize,
            });
            resolve();
            return;
          }
          if (data.phase === "failed" && asyncMode) {
            es.close();
            reject(new Error(data.error || "Processing failed"));
            return;
          }
          if (typeof data.percent === "number") {
            onProgress(data.percent);
          }
        } catch {}
      };
      es.onerror = () => {
        if (!asyncMode) es.close();
      };

      const maskFile = new File([maskBlob], "mask.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mask", maskFile);
      formData.append("clientJobId", clientJobId);
      formData.append("format", outputFormat);
      formData.append("quality", String(quality));

      const xhr = new XMLHttpRequest();
      xhr.timeout = 600_000;
      xhr.onload = () => {
        if (xhr.status === 202) {
          asyncMode = true;
          return;
        }
        es.close();
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            useFileStore.getState().updateEntry(entryIndex, {
              processedUrl: data.downloadUrl,
              processedPreviewUrl: data.previewUrl ?? null,
              processedFilename: null,
              status: "completed",
              originalSize: data.originalSize,
              processedSize: data.processedSize,
            });
            resolve();
          } catch {
            reject(new Error("Invalid response"));
          }
        } else {
          try {
            const body = JSON.parse(xhr.responseText);
            reject(
              new Error(
                typeof body.error === "string"
                  ? body.error
                  : typeof body.details === "string"
                    ? body.details
                    : `Failed: ${xhr.status}`,
              ),
            );
          } catch {
            reject(new Error(`Processing failed: ${xhr.status}`));
          }
        }
      };
      xhr.onerror = () => {
        es.close();
        reject(new Error("Network error"));
      };
      xhr.ontimeout = () => {
        es.close();
        reject(new Error("Request timed out"));
      };
      xhr.open("POST", "/api/v1/tools/erase-object");
      for (const [key, value] of formatHeaders()) {
        xhr.setRequestHeader(key, value);
      }
      xhr.send(formData);
    });
  };

  const handleProcess = async () => {
    if (files.length === 0 || !eraserRef.current) return;

    const capturedIndex = useFileStore.getState().selectedIndex;

    const maskBlob = await eraserRef.current.exportMask();
    if (!maskBlob) return;

    // Record where the user painted so the comparison slider starts at that location
    const maskCenter = eraserRef.current.getMaskCenter();
    if (maskCenter !== null && onMaskCenter) {
      onMaskCenter(maskCenter);
    }

    setError(null);
    setProcessing(true);
    setProgressPhase("uploading");
    setProgressPercent(0);
    setElapsed(0);

    const startTime = Date.now();
    elapsedRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const clientJobId = generateId();
    let asyncMode = false;

    const es = new EventSource(`/api/v1/jobs/${clientJobId}/progress`);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== "single") return;

        if (data.phase === "complete" && data.result) {
          if (elapsedRef.current) clearInterval(elapsedRef.current);
          es.close();
          const r = data.result;
          useFileStore.getState().updateEntry(capturedIndex, {
            processedUrl: r.downloadUrl,
            processedPreviewUrl: r.previewUrl ?? null,
            processedFilename: null,
            status: "completed",
            originalSize: r.originalSize,
            processedSize: r.processedSize,
          });
          setProcessing(false);
          setProgressPhase("idle");
          setProgressStage(null);
          return;
        }

        if (data.phase === "failed" && asyncMode) {
          if (elapsedRef.current) clearInterval(elapsedRef.current);
          es.close();
          setError(data.error || "Processing failed");
          setProcessing(false);
          setProgressPhase("idle");
          return;
        }

        if (typeof data.percent === "number") {
          setProgressPhase("processing");
          setProgressPercent(15 + (data.percent / 100) * 85);
        }
      } catch {}
    };
    es.onerror = () => {
      if (!asyncMode) es.close();
    };

    const maskFile = new File([maskBlob], "mask.png", { type: "image/png" });

    const formData = new FormData();
    formData.append("file", entries[capturedIndex].file);
    formData.append("mask", maskFile);
    formData.append("clientJobId", clientJobId);
    formData.append("format", outputFormat);
    formData.append("quality", String(quality));

    const xhr = new XMLHttpRequest();
    xhr.timeout = 600_000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgressPercent((e.loaded / e.total) * 15);
      }
    };
    xhr.upload.onload = () => {
      setProgressPhase("processing");
      setProgressPercent(15);
    };
    xhr.onload = () => {
      if (xhr.status === 202) {
        asyncMode = true;
        return;
      }

      if (elapsedRef.current) clearInterval(elapsedRef.current);
      es.close();

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          useFileStore.getState().updateEntry(capturedIndex, {
            processedUrl: data.downloadUrl,
            processedPreviewUrl: data.previewUrl ?? null,
            processedFilename: null,
            status: "completed",
            originalSize: data.originalSize,
            processedSize: data.processedSize,
          });
        } catch {
          setError("Invalid response");
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          setError(
            typeof body.error === "string"
              ? body.error
              : typeof body.details === "string"
                ? body.details
                : `Failed: ${xhr.status}`,
          );
        } catch {
          setError(`Processing failed: ${xhr.status}`);
        }
      }
      setProcessing(false);
      setProgressPhase("idle");
      setProgressStage(null);
    };
    xhr.onerror = () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      es.close();
      setError("Network error");
      setProcessing(false);
      setProgressPhase("idle");
    };
    xhr.ontimeout = () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      es.close();
      setError("Request timed out - the server may be overloaded. Try again.");
      setProcessing(false);
      setProgressPhase("idle");
    };
    xhr.open("POST", "/api/v1/tools/erase-object");
    formatHeaders().forEach((value, key) => {
      xhr.setRequestHeader(key, value);
    });
    xhr.send(formData);
  };

  const handleProcessAll = async () => {
    if (!eraserRef.current) return;

    const masks = await eraserRef.current.exportAllMasks();
    if (masks.size === 0) return;

    const { entries: currentEntries } = useFileStore.getState();

    // Map blobUrl -> entry index
    const blobToIndex = new Map<string, number>();
    for (let i = 0; i < currentEntries.length; i++) {
      blobToIndex.set(currentEntries[i].blobUrl, i);
    }

    const work: { index: number; file: File; maskBlob: Blob }[] = [];
    for (const [blobUrl, maskBlob] of masks) {
      const idx = blobToIndex.get(blobUrl);
      if (idx !== undefined) {
        work.push({ index: idx, file: currentEntries[idx].file, maskBlob });
      }
    }
    if (work.length === 0) return;

    setError(null);
    setProcessing(true);
    setProgressPhase("uploading");
    setProgressPercent(0);
    setElapsed(0);

    const startTime = Date.now();
    elapsedRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    for (let wi = 0; wi < work.length; wi++) {
      const { index, file, maskBlob } = work[wi];
      const basePercent = (wi / work.length) * 100;
      const sliceWeight = 100 / work.length;

      setProgressPhase("processing");
      setProgressPercent(basePercent);
      setProgressStage(`Erasing ${wi + 1}/${work.length}`);

      useFileStore.getState().updateEntry(index, { status: "processing", error: null });

      try {
        await processOneFile(index, file, maskBlob, (pct) => {
          setProgressPercent(basePercent + (pct / 100) * sliceWeight);
        });
      } catch (err) {
        useFileStore.getState().updateEntry(index, {
          status: "failed",
          error: err instanceof Error ? err.message : "Processing failed",
        });
      }
    }

    if (elapsedRef.current) clearInterval(elapsedRef.current);
    setProcessing(false);
    setProgressPhase("idle");
    setProgressStage(null);
  };

  const hasFile = files.length > 0;

  return (
    <div className="space-y-4">
      {/* Brush size */}
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="eraser-brush-size" className="text-xs text-muted-foreground">
            Brush Size
          </label>
          <span className="text-xs font-mono text-foreground">{brushSize}px</span>
        </div>
        <input
          id="eraser-brush-size"
          type="range"
          min={5}
          max={100}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-full mt-1"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
          <span>Fine</span>
          <span>Wide</span>
        </div>
      </div>

      {/* Clear / Undo */}
      {hasStrokes && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => eraserRef.current?.undo()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 text-xs"
          >
            <Redo className="h-3.5 w-3.5" />
            Undo
          </button>
          <button
            type="button"
            onClick={() => eraserRef.current?.clear()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      )}

      {/* Output Format */}
      <div>
        <label htmlFor="eraser-format" className="text-xs text-muted-foreground">
          Output Format
        </label>
        <select
          id="eraser-format"
          value={outputFormat}
          onChange={(e) => setOutputFormat(e.target.value)}
          className="w-full mt-1 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
        >
          {OUTPUT_FORMATS.map((f) => (
            <option key={f} value={f}>
              {f.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Quality (lossy formats only) */}
      {LOSSY_FORMATS.includes(outputFormat) && (
        <div>
          <div className="flex justify-between items-center">
            <label htmlFor="eraser-quality" className="text-xs text-muted-foreground">
              Quality
            </label>
            <span className="text-xs font-mono text-foreground">{quality}</span>
          </div>
          <input
            id="eraser-quality"
            type="range"
            min={1}
            max={100}
            step={1}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full mt-1"
          />
        </div>
      )}

      {/* Hint */}
      {hasFile && !hasStrokes && (
        <p className="text-[10px] text-muted-foreground">
          Paint over the objects you want to remove. Use Ctrl+Z to undo.
        </p>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Size info */}
      {currentEntry?.originalSize != null &&
        currentEntry?.processedSize != null &&
        currentEntry?.status === "completed" && (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>Original: {(currentEntry.originalSize / 1024).toFixed(1)} KB</p>
            <p>Processed: {(currentEntry.processedSize / 1024).toFixed(1)} KB</p>
          </div>
        )}

      {/* Process button */}
      {processing ? (
        <ProgressCard
          active={processing}
          phase={progressPhase === "idle" ? "uploading" : progressPhase}
          label={progressStage || "Erasing object"}
          percent={progressPercent}
          elapsed={elapsed}
        />
      ) : (
        <button
          type="button"
          data-testid="erase-object-submit"
          onClick={maskedFileCount > 1 ? handleProcessAll : handleProcess}
          disabled={!hasFile || (!hasStrokes && maskedFileCount === 0) || processing}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {maskedFileCount > 1 ? `Erase All (${maskedFileCount})` : "Erase Object"}
        </button>
      )}

      {/* Download */}
      {currentEntry?.processedUrl && (
        <a
          href={currentEntry.processedUrl}
          download
          data-testid="erase-object-download"
          className="w-full py-2.5 rounded-lg border border-primary text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      )}
    </div>
  );
}
