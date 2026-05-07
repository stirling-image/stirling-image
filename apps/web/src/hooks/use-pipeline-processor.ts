import { useCallback, useEffect, useRef, useState } from "react";
import { formatHeaders, parseApiError } from "@/lib/api";
import { generateId } from "@/lib/utils";
import { useFileStore } from "@/stores/file-store";
import type { PipelineStep } from "@/stores/pipeline-store";

interface ProcessResult {
  jobId: string;
  downloadUrl: string;
  previewUrl?: string;
  originalSize: number;
  processedSize: number;
  savedFileId?: string;
}

export interface PipelineProgress {
  phase: "idle" | "uploading" | "processing" | "complete";
  percent: number;
  stage?: string;
  elapsed: number;
}

const IDLE_PROGRESS: PipelineProgress = {
  phase: "idle",
  percent: 0,
  elapsed: 0,
};

export function usePipelineProcessor() {
  const { processing, error, processedUrl, originalSize, processedSize, setProcessing, setError } =
    useFileStore();

  const [progress, setProgress] = useState<PipelineProgress>(IDLE_PROGRESS);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const processingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      if (processingTimerRef.current) clearInterval(processingTimerRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (xhrRef.current) xhrRef.current.abort();
    };
  }, []);

  const processSingle = useCallback(
    (file: File, steps: PipelineStep[]) => {
      // Capture the file index at request time so results are written
      // to the correct entry even if the user navigates away.
      const capturedIndex = useFileStore.getState().selectedIndex;

      setError(null);
      // Mark the target entry as processing and clear any old result
      useFileStore.getState().updateEntry(capturedIndex, {
        processedUrl: null,
        processedPreviewUrl: null,
        processedFilename: null,
        status: "processing",
        error: null,
      });
      setProcessing(true);
      setProgress({ phase: "uploading", percent: 0, elapsed: 0 });

      // Start elapsed timer
      const startTime = Date.now();
      elapsedRef.current = setInterval(() => {
        setProgress((prev) => ({
          ...prev,
          elapsed: Math.floor((Date.now() - startTime) / 1000),
        }));
      }, 1000);

      // Build pipeline payload
      const pipeline = {
        steps: steps.map((s) => ({ toolId: s.toolId, settings: s.settings })),
      };

      const formData = new FormData();
      formData.append("file", file);
      formData.append("pipeline", JSON.stringify(pipeline));

      // Use XHR for upload progress tracking
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      // Pipeline runs multiple steps sequentially, allow up to 10 minutes
      xhr.timeout = 600_000;

      // Pipeline is always "medium" speed: upload = 0-40%, processing = 40-95%
      const UPLOAD_WEIGHT = 40;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const uploadPercent = (event.loaded / event.total) * UPLOAD_WEIGHT;
          setProgress((prev) => {
            if (prev.phase !== "uploading") return prev;
            return { ...prev, percent: uploadPercent };
          });
        }
      };

      xhr.upload.onload = () => {
        setProgress((prev) => ({
          ...prev,
          phase: "processing",
          percent: UPLOAD_WEIGHT,
          stage: "Processing...",
        }));

        // Gradually fill from upload weight to 95% over ~45s
        const start = UPLOAD_WEIGHT;
        const target = 95;
        const step = (target - start) / 90; // 90 ticks over ~45s
        processingTimerRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev.phase !== "processing") return prev;
            const next = Math.min(target, prev.percent + step);
            return { ...prev, percent: next };
          });
        }, 500);
      };

      xhr.onload = () => {
        if (elapsedRef.current) clearInterval(elapsedRef.current);
        if (processingTimerRef.current) clearInterval(processingTimerRef.current);

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result: ProcessResult = JSON.parse(xhr.responseText);
            useFileStore.getState().updateEntry(capturedIndex, {
              processedUrl: result.downloadUrl,
              processedPreviewUrl: result.previewUrl ?? null,
              processedFilename: null,
              status: "completed",
              originalSize: result.originalSize,
              processedSize: result.processedSize,
              ...(result.savedFileId ? { serverFileId: result.savedFileId } : {}),
            });
          } catch {
            setError("Invalid response from server");
          }
        } else {
          try {
            const body = JSON.parse(xhr.responseText);
            const parsed = parseApiError(body, xhr.status);
            if (typeof parsed === "object" && parsed.type === "feature_not_installed") {
              setError(
                `The "${parsed.featureName}" feature is not installed. Enable it in Settings → AI Features.`,
              );
            } else {
              setError(parsed as string);
            }
          } catch {
            setError(`Processing failed: ${xhr.status}`);
          }
        }

        setProcessing(false);
        setProgress(IDLE_PROGRESS);
      };

      xhr.onerror = () => {
        if (elapsedRef.current) clearInterval(elapsedRef.current);
        if (processingTimerRef.current) clearInterval(processingTimerRef.current);
        setError("Network error - check your connection");
        setProcessing(false);
        setProgress(IDLE_PROGRESS);
      };

      xhr.ontimeout = () => {
        if (elapsedRef.current) clearInterval(elapsedRef.current);
        if (processingTimerRef.current) clearInterval(processingTimerRef.current);
        setError("Request timed out - the server may be overloaded. Try again.");
        setProcessing(false);
        setProgress(IDLE_PROGRESS);
      };

      xhr.open("POST", "/api/v1/pipeline/execute");
      formatHeaders().forEach((value, key) => {
        xhr.setRequestHeader(key, value);
      });
      xhr.send(formData);
    },
    [setProcessing, setError],
  );

  const processAll = useCallback(
    async (files: File[], steps: PipelineStep[]) => {
      if (files.length === 0) {
        setError("No files selected");
        return;
      }
      if (files.length === 1) {
        processSingle(files[0], steps);
        return;
      }

      const { updateEntry, setBatchZip } = useFileStore.getState();

      setError(null);
      setProcessing(true);
      setProgress({ phase: "uploading", percent: 0, elapsed: 0 });

      const startTime = Date.now();
      elapsedRef.current = setInterval(() => {
        setProgress((prev) => ({ ...prev, elapsed: Math.floor((Date.now() - startTime) / 1000) }));
      }, 1000);

      const clientJobId = generateId();

      // Open SSE before upload for real-time progress
      try {
        const es = new EventSource(`/api/v1/jobs/${clientJobId}/progress`);
        eventSourceRef.current = es;
        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "batch") {
              const pct =
                data.totalFiles > 0 ? 15 + (data.completedFiles / data.totalFiles) * 85 : 15;
              setProgress((prev) => ({
                ...prev,
                phase: "processing",
                percent: pct,
                stage: data.currentFile
                  ? `Processing ${data.currentFile} (${data.completedFiles}/${data.totalFiles})`
                  : `Processing ${data.completedFiles}/${data.totalFiles}`,
              }));
            }
          } catch {
            /* ignore malformed SSE */
          }
        };
        es.onerror = () => {
          es.close();
          eventSourceRef.current = null;
        };
      } catch {
        /* SSE failed, proceed without */
      }

      const pipeline = {
        steps: steps.map((s) => ({ toolId: s.toolId, settings: s.settings })),
      };

      const formData = new FormData();
      for (const file of files) formData.append("file", file);
      formData.append("pipeline", JSON.stringify(pipeline));
      formData.append("clientJobId", clientJobId);

      try {
        const response = await fetch("/api/v1/pipeline/batch", {
          method: "POST",
          headers: formatHeaders(),
          body: formData,
        });

        if (elapsedRef.current) clearInterval(elapsedRef.current);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        if (!response.ok) {
          const text = await response.text();
          let errorMsg: string;
          try {
            const body = JSON.parse(text);
            if (body.errors && Array.isArray(body.errors) && body.errors.length > 0) {
              // Show the first file's step-level error (all files typically fail at the same step)
              const first = body.errors[0];
              errorMsg = first.error;
              if (body.errors.length > 1) {
                errorMsg += ` (${body.errors.length} files failed)`;
              }
            } else {
              const parsed = parseApiError(body, response.status);
              if (typeof parsed === "object" && parsed.type === "feature_not_installed") {
                errorMsg = `The "${parsed.featureName}" feature is not installed. Enable it in Settings → AI Features.`;
              } else {
                errorMsg = parsed as string;
              }
            }
          } catch {
            errorMsg = `Batch processing failed: ${response.status}`;
          }
          setError(errorMsg);
          setProcessing(false);
          setProgress(IDLE_PROGRESS);
          return;
        }

        const zipBlob = await response.blob();
        setBatchZip(zipBlob, "batch-pipeline.zip");

        // Extract files from ZIP using fflate
        const { unzipSync } = await import("fflate");
        const zipBuffer = new Uint8Array((await zipBlob.arrayBuffer()) as ArrayBuffer);
        const extracted = unzipSync(zipBuffer);

        const entries = useFileStore.getState().entries;
        let fileResults: Record<string, string> = {};
        try {
          fileResults = JSON.parse(response.headers.get("X-File-Results") ?? "{}");
        } catch {
          // Malformed header - fall back to empty mapping, all entries marked failed
        }

        for (let i = 0; i < entries.length; i++) {
          const processedName = fileResults[String(i)];
          if (processedName && extracted[processedName]) {
            const blob = new Blob([extracted[processedName] as BlobPart]);
            updateEntry(i, {
              processedUrl: URL.createObjectURL(blob),
              processedFilename: processedName,
              processedSize: blob.size,
              status: "completed",
              error: null,
            });
          } else {
            updateEntry(i, { status: "failed", error: "File not found in batch results" });
          }
        }

        setProcessing(false);
        setProgress(IDLE_PROGRESS);
      } catch (err) {
        if (elapsedRef.current) clearInterval(elapsedRef.current);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        setError(err instanceof Error ? err.message : "Batch processing failed");
        setProcessing(false);
        setProgress(IDLE_PROGRESS);
      }
    },
    [processSingle, setProcessing, setError],
  );

  return {
    processSingle,
    processAll,
    processing,
    error,
    downloadUrl: processedUrl,
    originalSize,
    processedSize,
    progress,
  };
}
