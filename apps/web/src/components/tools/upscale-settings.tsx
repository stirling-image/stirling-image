import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProgressCard } from "@/components/common/progress-card";
import { useToolProcessor } from "@/hooks/use-tool-processor";
import { useFileStore } from "@/stores/file-store";

const QUICK_SCALES = [2, 3, 4, 6, 8];

export interface UpscaleControlsProps {
  onChange?: (settings: Record<string, unknown>) => void;
}

export function UpscaleControls({ onChange }: UpscaleControlsProps) {
  const [scale, setScale] = useState(2);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current?.({ scale });
  }, [scale]);

  return (
    <div className="space-y-4">
      {/* Scale factor */}
      <div>
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-muted-foreground">Scale Factor</p>
          <span className="text-sm font-mono font-medium">{scale}x</span>
        </div>
        <div className="flex gap-1 mt-1.5">
          {QUICK_SCALES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScale(s)}
              className={`flex-1 text-xs py-1.5 rounded ${
                scale === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        <input
          type="range"
          min={2}
          max={8}
          step={1}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="w-full mt-2"
        />
      </div>
    </div>
  );
}

export function UpscaleSettings() {
  const { files } = useFileStore();
  const { processFiles, processing, error, downloadUrl, originalSize, processedSize, progress } =
    useToolProcessor("upscale");
  const [settings, setSettings] = useState<Record<string, unknown>>({});

  const handleProcess = () => {
    processFiles(files, settings);
  };

  const hasFile = files.length > 0;

  return (
    <div className="space-y-4">
      <UpscaleControls onChange={setSettings} />

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Size info */}
      {originalSize != null && processedSize != null && (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Original: {(originalSize / 1024).toFixed(1)} KB</p>
          <p>Upscaled: {(processedSize / 1024).toFixed(1)} KB</p>
        </div>
      )}

      {/* Process button */}
      {processing ? (
        <ProgressCard
          active={processing}
          phase={progress.phase === "idle" ? "uploading" : progress.phase}
          label="Upscaling image"
          percent={progress.percent}
          elapsed={progress.elapsed}
        />
      ) : (
        <button
          type="button"
          data-testid="upscale-submit"
          onClick={handleProcess}
          disabled={!hasFile || processing}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {`Upscale ${(settings.scale as number) ?? 2}x`}
        </button>
      )}

      {/* Download */}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          data-testid="upscale-download"
          className="w-full py-2.5 rounded-lg border border-primary text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      )}
    </div>
  );
}
