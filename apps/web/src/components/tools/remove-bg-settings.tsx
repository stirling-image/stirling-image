import { useState } from "react";
import { useFileStore } from "@/stores/file-store";
import { useToolProcessor } from "@/hooks/use-tool-processor";
import { ProgressCard } from "@/components/common/progress-card";
import { Download, User, Package, ImageIcon } from "lucide-react";

type SubjectType = "people" | "products" | "general";
type Quality = "fast" | "balanced" | "best";

type BgModel =
  | "birefnet-general"
  | "birefnet-general-lite"
  | "birefnet-portrait"
  | "bria-rmbg"
  | "u2net";

const MODEL_MAP: Record<SubjectType, Record<Quality, BgModel>> = {
  people:   { fast: "u2net", balanced: "birefnet-portrait", best: "birefnet-portrait" },
  products: { fast: "u2net", balanced: "bria-rmbg",         best: "birefnet-general" },
  general:  { fast: "u2net", balanced: "birefnet-general-lite", best: "birefnet-general" },
};

const SUBJECT_OPTIONS: { value: SubjectType; label: string; icon: typeof User }[] = [
  { value: "people", label: "People", icon: User },
  { value: "products", label: "Products", icon: Package },
  { value: "general", label: "General", icon: ImageIcon },
];

const QUALITY_OPTIONS: { value: Quality; label: string; hint: string }[] = [
  { value: "fast", label: "Fast", hint: "~2s" },
  { value: "balanced", label: "Balanced", hint: "~15s" },
  { value: "best", label: "Best", hint: "~60s" },
];

const BG_PRESETS = [
  { color: "", label: "Transparent", preview: "checkerboard" },
  { color: "#FFFFFF", label: "White", preview: "#FFFFFF" },
  { color: "#000000", label: "Black", preview: "#000000" },
  { color: "#FF0000", label: "Red", preview: "#FF0000" },
  { color: "#00FF00", label: "Green", preview: "#00FF00" },
  { color: "#0000FF", label: "Blue", preview: "#0000FF" },
];

export function RemoveBgSettings() {
  const { files } = useFileStore();
  const { processFiles, processing, error, downloadUrl, originalSize, processedSize, progress } =
    useToolProcessor("remove-background");

  const [subject, setSubject] = useState<SubjectType>("people");
  const [quality, setQuality] = useState<Quality>("balanced");
  const [isPassport, setIsPassport] = useState(false);
  const [bgColor, setBgColor] = useState("");

  const model = isPassport ? "birefnet-portrait" : MODEL_MAP[subject][quality];

  const handleProcess = () => {
    const settings: Record<string, unknown> = { model };
    if (bgColor) settings.backgroundColor = bgColor;
    processFiles(files, settings);
  };

  const hasFile = files.length > 0;

  return (
    <div className="space-y-4">
      {/* Subject type */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">What's in the photo?</label>
        <div className="grid grid-cols-3 gap-1.5 mt-1.5">
          {SUBJECT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setSubject(opt.value);
                  if (opt.value !== "people") setIsPassport(false);
                }}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                  subject === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Passport checkbox - only for people */}
      {subject === "people" && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPassport}
            onChange={(e) => setIsPassport(e.target.checked)}
            className="rounded border-border accent-primary"
          />
          <span className="text-sm text-muted-foreground">Passport / ID photo</span>
        </label>
      )}

      {/* Quality */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">Quality</label>
        <div className="grid grid-cols-3 gap-1.5 mt-1.5">
          {QUALITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setQuality(opt.value)}
              className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${
                quality === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <div>{opt.label}</div>
              <div className="text-[10px] opacity-60 mt-0.5">{opt.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Background color - intuitive preset buttons */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Output Background
        </label>
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          {BG_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setBgColor(preset.color)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                bgColor === preset.color
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <span
                className="w-4 h-4 rounded-sm border border-border shrink-0"
                style={
                  preset.preview === "checkerboard"
                    ? {
                        backgroundImage:
                          "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                        backgroundSize: "8px 8px",
                        backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                      }
                    : { backgroundColor: preset.preview }
                }
              />
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom color picker */}
        <div className="flex items-center gap-2 mt-2">
          <input
            type="color"
            value={bgColor || "#ffffff"}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-8 h-8 rounded border border-border cursor-pointer"
          />
          <input
            type="text"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            placeholder="Custom hex (#FF5500)"
            className="flex-1 px-2 py-1.5 rounded border border-border bg-background text-xs text-foreground"
          />
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Size info */}
      {originalSize != null && processedSize != null && !processing && (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Original: {(originalSize / 1024).toFixed(1)} KB</p>
          <p>Processed: {(processedSize / 1024).toFixed(1)} KB</p>
        </div>
      )}

      {/* Process button */}
      {processing ? (
        <ProgressCard
          active={processing}
          phase={progress.phase === "idle" ? "uploading" : progress.phase}
          label="Removing background"
          stage={progress.stage}
          percent={progress.percent}
          elapsed={progress.elapsed}
        />
      ) : (
        <button
          onClick={handleProcess}
          disabled={!hasFile || processing}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Remove Background
        </button>
      )}

      {/* Download */}
      {downloadUrl && !processing && (
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
