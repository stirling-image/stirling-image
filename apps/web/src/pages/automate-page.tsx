import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  Save,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BeforeAfterSlider } from "@/components/common/before-after-slider";
import { Dropzone } from "@/components/common/dropzone";
import { ImageViewer } from "@/components/common/image-viewer";
import { ProgressCard } from "@/components/common/progress-card";
import { ThumbnailStrip } from "@/components/common/thumbnail-strip";
import { AppLayout } from "@/components/layout/app-layout";
import { PipelineBuilder } from "@/components/tools/pipeline-builder";
import { usePipelineProcessor } from "@/hooks/use-pipeline-processor";
import { formatHeaders } from "@/lib/api";
import { formatFileSize } from "@/lib/download";
import { useFileStore } from "@/stores/file-store";
import { type SavedPipeline, usePipelineStore } from "@/stores/pipeline-store";

export function AutomatePage() {
  const {
    files,
    entries,
    setFiles,
    addFiles,
    reset: resetFiles,
    processedUrl,
    originalBlobUrl,
    originalSize,
    processedSize,
    selectedFileName,
    selectedFileSize,
    batchZipBlob,
    batchZipFilename,
    selectedIndex,
    setSelectedIndex,
    navigateNext,
    navigatePrev,
    currentEntry,
  } = useFileStore();

  const {
    steps,
    expandedStepId,
    savedPipelines,
    addStep,
    removeStep,
    reorderSteps,
    updateStepSettings,
    setExpandedStep,
    loadSteps,
    setSavedPipelines,
  } = usePipelineStore();

  const { processSingle, processAll, processing, error, progress } = usePipelineProcessor();

  // Local state
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAllSaved, setShowAllSaved] = useState(false);

  const hasFile = files.length > 0;
  const hasProcessed = !!processedUrl;
  const hasMultiple = entries.length > 1;
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex < entries.length - 1;

  // Load saved pipelines on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/pipeline/list", {
          headers: formatHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setSavedPipelines(data.pipelines || []);
        }
      } catch {
        // Silently fail
      }
    })();
  }, [setSavedPipelines]);

  const handleFiles = useCallback(
    (newFiles: File[]) => {
      resetFiles();
      setFiles(newFiles);
    },
    [setFiles, resetFiles],
  );

  const handleAddMore = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,.heic,.heif,.hif";
    input.onchange = (e) => {
      const picked = Array.from((e.target as HTMLInputElement).files || []);
      if (picked.length > 0) addFiles(picked);
    };
    input.click();
  }, [addFiles]);

  const handleProcess = useCallback(() => {
    if (files.length === 0 || steps.length === 0) return;
    if (files.length === 1) {
      processSingle(files[0], steps);
    } else {
      processAll(files, steps);
    }
  }, [files, steps, processSingle, processAll]);

  const handleSave = useCallback(async () => {
    if (!saveName.trim() || steps.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/pipeline/save", {
        method: "POST",
        headers: formatHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name: saveName.trim(),
          description: saveDescription.trim() || undefined,
          steps: steps.map((s) => ({ toolId: s.toolId, settings: s.settings })),
        }),
      });
      if (res.ok) {
        // Refresh saved pipelines
        const listRes = await fetch("/api/v1/pipeline/list", {
          headers: formatHeaders(),
        });
        if (listRes.ok) {
          const data = await listRes.json();
          setSavedPipelines(data.pipelines || []);
        }
        setSaveName("");
        setSaveDescription("");
        setShowSaveForm(false);
      }
    } catch {
      // Save failed silently
    } finally {
      setSaving(false);
    }
  }, [saveName, saveDescription, steps, setSavedPipelines]);

  const handleDeletePipeline = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/v1/pipeline/${id}`, {
          method: "DELETE",
          headers: formatHeaders(),
        });
        const listRes = await fetch("/api/v1/pipeline/list", {
          headers: formatHeaders(),
        });
        if (listRes.ok) {
          const data = await listRes.json();
          setSavedPipelines(data.pipelines || []);
        }
      } catch {
        // ignore
      }
    },
    [setSavedPipelines],
  );

  const handleLoadPipeline = useCallback(
    (pipeline: SavedPipeline) => {
      loadSteps(pipeline.steps);
    },
    [loadSteps],
  );

  const handleDownloadAll = useCallback(() => {
    if (!batchZipBlob) return;
    const url = URL.createObjectURL(batchZipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = batchZipFilename ?? "batch-pipeline.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, [batchZipBlob, batchZipFilename]);

  const handleImageKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigatePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateNext();
      }
    },
    [navigateNext, navigatePrev],
  );

  return (
    <AppLayout showToolPanel={false}>
      <div className="flex h-full w-full overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-72 border-r border-border flex flex-col shrink-0 hidden md:flex">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Automate</h1>
              <p className="text-xs text-muted-foreground">Chain tools into a pipeline</p>
            </div>
          </div>

          {/* Saved pipelines strip */}
          {savedPipelines.length > 0 && (
            <div className="px-4 pt-3 pb-2 border-b border-border shrink-0">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                Saved Pipelines
              </h3>
              {showAllSaved ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {savedPipelines.map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5 group">
                      <button
                        type="button"
                        onClick={() => handleLoadPipeline(p)}
                        className="flex-1 text-left text-xs text-foreground hover:text-primary truncate py-1 px-2 rounded hover:bg-muted"
                      >
                        {p.name}
                        <span className="text-muted-foreground ml-1">
                          ({p.steps.length} step{p.steps.length !== 1 ? "s" : ""})
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePipeline(p.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowAllSaved(false)}
                    className="text-xs text-muted-foreground hover:text-foreground mt-1"
                  >
                    Show less
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {savedPipelines.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleLoadPipeline(p)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs text-foreground hover:bg-primary/10 hover:text-primary transition-colors truncate max-w-[120px]"
                    >
                      <Play className="h-3 w-3 shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                  {savedPipelines.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSaved(true)}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                    >
                      +{savedPipelines.length - 3} more
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* File info */}
          <div className="px-4 pt-3 pb-2 border-b border-border shrink-0">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
              Files
            </h3>
            {files.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Drop or upload images to get started
              </p>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    {files.length} file{files.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMore}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    + Add more
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-foreground bg-muted rounded px-2 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span className="truncate flex-1">{selectedFileName ?? files[0].name}</span>
                  <span className="text-muted-foreground shrink-0 ml-1">
                    {formatFileSize(selectedFileSize ?? files[0].size)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => resetFiles()}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="px-4 pt-2 shrink-0">
              <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded px-2 py-1.5 flex items-start gap-1.5">
                <X className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Pipeline steps (scrollable) */}
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
              Pipeline Steps
            </h3>
            <PipelineBuilder
              steps={steps}
              expandedStepId={expandedStepId}
              onAddStep={addStep}
              onRemoveStep={removeStep}
              onReorderSteps={reorderSteps}
              onUpdateSettings={updateStepSettings}
              onToggleStep={setExpandedStep}
            />
          </div>

          {/* Progress card */}
          {processing && (
            <div className="px-4 pb-2 shrink-0">
              <ProgressCard
                active={progress.phase !== "idle"}
                phase={progress.phase === "idle" ? "processing" : progress.phase}
                label={
                  files.length > 1
                    ? `Processing ${files.length} files...`
                    : "Processing pipeline..."
                }
                stage={progress.stage}
                percent={progress.percent}
                elapsed={progress.elapsed}
              />
            </div>
          )}

          {/* Action buttons (sticky bottom) */}
          <div className="p-4 border-t border-border space-y-2 shrink-0">
            {/* Process button */}
            <button
              type="button"
              onClick={handleProcess}
              disabled={!hasFile || steps.length === 0 || processing}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4" />
              {files.length <= 1 ? "Process" : `Process All (${files.length} files)`}
            </button>

            {/* Download All ZIP */}
            {hasProcessed && batchZipBlob && (
              <button
                type="button"
                onClick={handleDownloadAll}
                className="w-full py-2.5 rounded-lg border border-primary text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5"
              >
                <Download className="h-4 w-4" />
                Download All (ZIP)
              </button>
            )}

            {/* Save pipeline */}
            {steps.length > 0 && !showSaveForm && (
              <button
                type="button"
                onClick={() => setShowSaveForm(true)}
                className="w-full py-2 rounded-lg border border-border text-muted-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted hover:text-foreground text-sm"
              >
                <Save className="h-4 w-4" />
                Save Pipeline
              </button>
            )}

            {showSaveForm && (
              <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Pipeline name"
                  className="w-full text-sm px-2.5 py-1.5 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground"
                />
                <input
                  type="text"
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full text-sm px-2.5 py-1.5 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!saveName.trim() || saving}
                    className="flex-1 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveForm(false);
                      setSaveName("");
                      setSaveDescription("");
                    }}
                    className="px-3 py-1.5 rounded border border-border text-sm text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <section
          aria-label="Image area"
          className="flex-1 flex flex-col overflow-hidden min-h-0"
          onKeyDown={hasMultiple ? handleImageKeyDown : undefined}
          tabIndex={hasMultiple ? 0 : undefined}
        >
          <div className="flex-1 relative flex items-center justify-center p-6 min-h-0">
            {/* Nav arrows */}
            {hasMultiple && hasPrev && (
              <button
                type="button"
                onClick={navigatePrev}
                className="absolute left-3 z-10 w-8 h-8 rounded-full bg-background/80 border border-border shadow-sm flex items-center justify-center hover:bg-background transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {hasMultiple && hasNext && (
              <button
                type="button"
                onClick={navigateNext}
                className="absolute right-3 z-10 w-8 h-8 rounded-full bg-background/80 border border-border shadow-sm flex items-center justify-center hover:bg-background transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {hasMultiple && (
              <div className="absolute top-3 right-3 z-10 bg-background/80 border border-border px-2 py-0.5 rounded-full text-xs text-muted-foreground tabular-nums">
                {selectedIndex + 1} / {entries.length}
              </div>
            )}

            {/* Image display area */}
            {!hasFile && (
              <Dropzone onFiles={handleFiles} accept="image/*" multiple currentFiles={files} />
            )}

            {hasFile && !hasProcessed && currentEntry?.status === "failed" && (
              <div className="flex flex-col items-center justify-center gap-3 h-full text-center px-4">
                <p className="text-sm text-red-500">
                  {currentEntry.error ?? "Processing failed for this file"}
                </p>
              </div>
            )}

            {hasFile && hasProcessed && originalBlobUrl && (
              <BeforeAfterSlider
                beforeSrc={originalBlobUrl}
                afterSrc={processedUrl as string}
                beforeSize={originalSize ?? undefined}
                afterSize={processedSize ?? undefined}
              />
            )}

            {hasFile && !hasProcessed && originalBlobUrl && currentEntry?.status !== "failed" && (
              <ImageViewer
                src={originalBlobUrl}
                filename={selectedFileName ?? files[0].name}
                fileSize={selectedFileSize ?? files[0].size}
              />
            )}
          </div>

          {/* Info bar */}
          {hasFile && (
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-border text-xs text-muted-foreground shrink-0">
              <span className="truncate mr-2">{selectedFileName ?? files[0].name}</span>
              <div className="flex items-center gap-3 shrink-0">
                {hasProcessed && processedSize != null && (
                  <span>
                    {formatFileSize(originalSize ?? 0)} &rarr; {formatFileSize(processedSize)}
                  </span>
                )}
                {!hasProcessed && <span>{formatFileSize(selectedFileSize ?? files[0].size)}</span>}
              </div>
            </div>
          )}

          {/* Thumbnail strip for multi-file */}
          {hasMultiple && (
            <ThumbnailStrip
              entries={entries}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
            />
          )}
        </section>
      </div>
    </AppLayout>
  );
}
