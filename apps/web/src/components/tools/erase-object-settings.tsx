import { useState } from "react";
import { useFileStore } from "@/stores/file-store";
import { Download, Loader2, Upload } from "lucide-react";

function getToken(): string {
  return localStorage.getItem("stirling-token") || "";
}

export function EraseObjectSettings() {
  const { files, processing, error, setProcessing, setError } = useFileStore();

  const [maskFile, setMaskFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [processedSize, setProcessedSize] = useState<number | null>(null);

  const handleMaskSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setMaskFile(selected);
  };

  const handleProcess = async () => {
    if (files.length === 0 || !maskFile) return;

    setProcessing(true);
    setError(null);
    setDownloadUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("mask", maskFile);

      const res = await fetch("/api/v1/tools/erase-object", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.details || `Failed: ${res.status}`);
      }

      const data = await res.json();
      setDownloadUrl(data.downloadUrl);
      setOriginalSize(data.originalSize);
      setProcessedSize(data.processedSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Object erasing failed");
    } finally {
      setProcessing(false);
    }
  };

  const hasFile = files.length > 0;

  return (
    <div className="space-y-4">
      {/* Mask upload */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">Mask Image</label>
        <p className="text-[10px] text-muted-foreground mt-0.5 mb-1.5">
          Upload a black &amp; white mask where white areas will be erased. Create the mask in any image editor.
        </p>
        <label className="flex items-center gap-2 px-3 py-2 rounded border border-dashed border-border cursor-pointer hover:border-primary">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {maskFile ? maskFile.name : "Select mask image..."}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleMaskSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Info */}
      <div className="p-2 rounded bg-muted text-[10px] text-muted-foreground space-y-1">
        <p>How to create a mask:</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>Open your image in any editor</li>
          <li>Paint white over areas to erase</li>
          <li>Keep the rest black</li>
          <li>Export as PNG and upload here</li>
        </ol>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Size info */}
      {originalSize != null && processedSize != null && (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Original: {(originalSize / 1024).toFixed(1)} KB</p>
          <p>Processed: {(processedSize / 1024).toFixed(1)} KB</p>
        </div>
      )}

      {/* Process button */}
      <button
        onClick={handleProcess}
        disabled={!hasFile || !maskFile || processing}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing && <Loader2 className="h-4 w-4 animate-spin" />}
        {processing ? "Erasing..." : "Erase Object"}
      </button>

      {/* Progress indicator */}
      {processing && (
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            AI processing may take 10-30 seconds...
          </p>
        </div>
      )}

      {/* Download */}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="w-full py-2.5 rounded-lg border border-primary text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      )}
    </div>
  );
}
