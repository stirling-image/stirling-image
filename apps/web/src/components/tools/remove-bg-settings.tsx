import { useState } from "react";
import { useFileStore } from "@/stores/file-store";
import { useToolProcessor } from "@/hooks/use-tool-processor";
import { Download, Loader2 } from "lucide-react";

type BgModel = "u2net" | "isnet";

export function RemoveBgSettings() {
  const { files } = useFileStore();
  const { processFiles, processing, error, downloadUrl, originalSize, processedSize } =
    useToolProcessor("remove-background");

  const [model, setModel] = useState<BgModel>("u2net");
  const [bgColor, setBgColor] = useState("");

  const handleProcess = () => {
    const settings: Record<string, unknown> = { model };
    if (bgColor) settings.backgroundColor = bgColor;
    processFiles(files, settings);
  };

  const hasFile = files.length > 0;

  return (
    <div className="space-y-4">
      {/* Model selector */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">AI Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as BgModel)}
          className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
        >
          <option value="u2net">U2-Net (General purpose)</option>
          <option value="isnet">IS-Net (Higher accuracy)</option>
        </select>
      </div>

      {/* Background color */}
      <div>
        <label className="text-xs text-muted-foreground">
          Replacement Background (leave empty for transparent)
        </label>
        <div className="flex gap-2 mt-0.5">
          <input
            type="color"
            value={bgColor || "#ffffff"}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-10 h-8 rounded border border-border cursor-pointer"
          />
          <input
            type="text"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            placeholder="Transparent"
            className="flex-1 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
          />
          {bgColor && (
            <button
              onClick={() => setBgColor("")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <p className="text-[10px] text-muted-foreground">
        Requires Python with rembg installed. Works best with photos of people, products, and animals.
      </p>

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
        disabled={!hasFile || processing}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing && <Loader2 className="h-4 w-4 animate-spin" />}
        {processing ? "Removing Background..." : "Remove Background"}
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
