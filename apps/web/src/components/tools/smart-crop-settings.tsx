import { useState } from "react";
import { ProgressCard } from "@/components/common/progress-card";
import { useToolProcessor } from "@/hooks/use-tool-processor";
import { useFileStore } from "@/stores/file-store";

type Mode = "content" | "attention";

const ASPECT_PRESETS = [
  { label: "1:1 Square", w: 1080, h: 1080 },
  { label: "16:9 Landscape", w: 1920, h: 1080 },
  { label: "9:16 Portrait", w: 1080, h: 1920 },
  { label: "4:3 Standard", w: 1440, h: 1080 },
  { label: "3:2 Photo", w: 1620, h: 1080 },
  { label: "Custom", w: 0, h: 0 },
];

export interface SmartCropControlsProps {
  onChange?: (settings: Record<string, unknown>) => void;
}

export function SmartCropControls({ onChange }: SmartCropControlsProps) {
  const [mode, setMode] = useState<Mode>("content");

  // Attention mode state
  const [width, setWidth] = useState("1080");
  const [height, setHeight] = useState("1080");
  const [preset, setPreset] = useState("1:1 Square");

  // Content mode state
  const [threshold, setThreshold] = useState(30);
  const [padToSquare, setPadToSquare] = useState(false);
  const [padColor, setPadColor] = useState("#ffffff");
  const [targetSize, setTargetSize] = useState("1000");
  const [quality, setQuality] = useState(95);

  const emit = (overrides: Record<string, unknown> = {}) => {
    if (mode === "content") {
      onChange?.({
        mode: "content",
        threshold,
        padToSquare,
        padColor,
        quality,
        ...(padToSquare ? { targetSize: Number(targetSize) } : {}),
        ...overrides,
      });
    } else {
      onChange?.({
        mode: "attention",
        width: Number(width),
        height: Number(height),
        quality,
        ...overrides,
      });
    }
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    if (m === "content") {
      onChange?.({ mode: "content", threshold, padToSquare, padColor, quality });
    } else {
      onChange?.({ mode: "attention", width: Number(width), height: Number(height), quality });
    }
  };

  const handlePreset = (label: string) => {
    setPreset(label);
    const p = ASPECT_PRESETS.find((a) => a.label === label);
    if (p && p.w > 0) {
      setWidth(String(p.w));
      setHeight(String(p.h));
      emit({ width: p.w, height: p.h });
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">Mode</label>
        <div className="flex gap-1 mt-1">
          <button
            type="button"
            onClick={() => handleModeChange("content")}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
              mode === "content"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Crop to Content
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("attention")}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
              mode === "attention"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Focus Crop
          </button>
        </div>
      </div>

      {mode === "content" ? (
        <>
          {/* Threshold */}
          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="trim-threshold" className="text-xs text-muted-foreground">
                Tolerance
              </label>
              <span className="text-xs text-muted-foreground tabular-nums">{threshold}</span>
            </div>
            <input
              id="trim-threshold"
              type="range"
              min={0}
              max={128}
              value={threshold}
              onChange={(e) => {
                const v = Number(e.target.value);
                setThreshold(v);
                emit({ threshold: v });
              }}
              className="w-full mt-1"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              How different a border pixel can be from the edge color and still be trimmed. Higher =
              more aggressive.
            </p>
          </div>

          {/* Pad to square */}
          <div className="flex items-center gap-2">
            <input
              id="pad-square"
              type="checkbox"
              checked={padToSquare}
              onChange={(e) => {
                setPadToSquare(e.target.checked);
                emit({ padToSquare: e.target.checked });
              }}
              className="rounded border-border"
            />
            <label htmlFor="pad-square" className="text-sm text-foreground">
              Pad to square
            </label>
          </div>

          {padToSquare && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="target-size" className="text-xs text-muted-foreground">
                  Target size (px)
                </label>
                <input
                  id="target-size"
                  type="number"
                  value={targetSize}
                  onChange={(e) => {
                    setTargetSize(e.target.value);
                    emit({ targetSize: Number(e.target.value) });
                  }}
                  min={1}
                  className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
                />
              </div>
              <div>
                <label htmlFor="pad-color" className="text-xs text-muted-foreground">
                  Pad color
                </label>
                <input
                  id="pad-color"
                  type="color"
                  value={padColor}
                  onChange={(e) => {
                    setPadColor(e.target.value);
                    emit({ padColor: e.target.value });
                  }}
                  className="w-12 h-[34px] mt-0.5 rounded border border-border bg-background cursor-pointer"
                />
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            Trims uniform-color borders around the subject, like GIMP's "Crop to Content." Enable
            "Pad to square" to produce e-commerce ready images.
          </p>
        </>
      ) : (
        <>
          {/* Aspect ratio preset */}
          <div>
            <label
              htmlFor="smart-crop-preset"
              className="text-sm font-medium text-muted-foreground"
            >
              Target Aspect Ratio
            </label>
            <select
              id="smart-crop-preset"
              value={preset}
              onChange={(e) => handlePreset(e.target.value)}
              className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
            >
              {ASPECT_PRESETS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Width / Height */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="smart-crop-width" className="text-xs text-muted-foreground">
                Width (px)
              </label>
              <input
                id="smart-crop-width"
                type="number"
                value={width}
                onChange={(e) => {
                  setWidth(e.target.value);
                  setPreset("Custom");
                  emit({ width: Number(e.target.value) });
                }}
                min={1}
                className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="smart-crop-height" className="text-xs text-muted-foreground">
                Height (px)
              </label>
              <input
                id="smart-crop-height"
                type="number"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  setPreset("Custom");
                  emit({ height: Number(e.target.value) });
                }}
                min={1}
                className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
              />
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Uses entropy-based attention detection to find the most interesting region and crops to
            it. Good for thumbnails and social media images.
          </p>
        </>
      )}

      {/* Quality slider */}
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="smart-crop-quality" className="text-xs text-muted-foreground">
            Output Quality
          </label>
          <span className="text-xs text-muted-foreground tabular-nums">{quality}%</span>
        </div>
        <input
          id="smart-crop-quality"
          type="range"
          min={1}
          max={100}
          value={quality}
          onChange={(e) => {
            const v = Number(e.target.value);
            setQuality(v);
            emit({ quality: v });
          }}
          className="w-full mt-1"
        />
        <p className="text-[10px] text-muted-foreground mt-0.5">
          For JPEG and WebP outputs. PNG is always lossless.
        </p>
      </div>
    </div>
  );
}

export function SmartCropSettings() {
  const { files } = useFileStore();
  const { processFiles, processAllFiles, processing, error, progress } =
    useToolProcessor("smart-crop");

  const [settings, setSettings] = useState<Record<string, unknown>>({
    mode: "content",
    threshold: 30,
    padToSquare: false,
    padColor: "#ffffff",
    quality: 95,
  });

  const handleProcess = () => {
    if (files.length > 1) {
      processAllFiles(files, settings);
    } else {
      processFiles(files, settings);
    }
  };

  const hasFile = files.length > 0;
  const mode = settings.mode as string;
  const canProcess =
    mode === "content" || (Number(settings.width) > 0 && Number(settings.height) > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasFile && canProcess && !processing) handleProcess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SmartCropControls onChange={setSettings} />

      {error && <p className="text-xs text-red-500">{error}</p>}

      {processing ? (
        <ProgressCard
          active={processing}
          phase={progress.phase === "idle" ? "uploading" : progress.phase}
          label="Smart cropping"
          stage={progress.stage}
          percent={progress.percent}
          elapsed={progress.elapsed}
        />
      ) : (
        <button
          type="submit"
          data-testid="smart-crop-submit"
          disabled={!hasFile || !canProcess || processing}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {mode === "content" ? "Crop to Content" : "Smart Crop"}
        </button>
      )}
    </form>
  );
}
