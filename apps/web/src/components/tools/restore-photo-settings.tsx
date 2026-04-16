import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProgressCard } from "@/components/common/progress-card";
import { useToolProcessor } from "@/hooks/use-tool-processor";
import { useFileStore } from "@/stores/file-store";

type Mode = "auto" | "light" | "heavy";

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "light", label: "Light", desc: "Gentle touch, preserves details" },
  { id: "auto", label: "Auto", desc: "Balanced restoration" },
  { id: "heavy", label: "Heavy", desc: "Aggressive repair for severe damage" },
];

export interface RestorePhotoControlsProps {
  settings?: Record<string, unknown>;
  onChange?: (settings: Record<string, unknown>) => void;
}

export function RestorePhotoControls({
  settings: initialSettings,
  onChange,
}: RestorePhotoControlsProps) {
  const [mode, setMode] = useState<Mode>("auto");
  const [scratchRemoval, setScratchRemoval] = useState(true);
  const [faceEnhancement, setFaceEnhancement] = useState(true);
  const [fidelity, setFidelity] = useState(70);
  const [denoise, setDenoise] = useState(true);
  const [denoiseStrength, setDenoiseStrength] = useState(40);
  const [colorize, setColorize] = useState(false);

  // One-time init from pipeline settings
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initialSettings || initializedRef.current) return;
    initializedRef.current = true;
    if (initialSettings.mode != null) setMode(initialSettings.mode as Mode);
    if (initialSettings.scratchRemoval != null)
      setScratchRemoval(Boolean(initialSettings.scratchRemoval));
    if (initialSettings.faceEnhancement != null)
      setFaceEnhancement(Boolean(initialSettings.faceEnhancement));
    if (initialSettings.fidelity != null) setFidelity(Number(initialSettings.fidelity) * 100);
    if (initialSettings.denoise != null) setDenoise(Boolean(initialSettings.denoise));
    if (initialSettings.denoiseStrength != null)
      setDenoiseStrength(Number(initialSettings.denoiseStrength));
    if (initialSettings.colorize != null) setColorize(Boolean(initialSettings.colorize));
  }, [initialSettings]);

  // Emit settings on change
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current?.({
      mode,
      scratchRemoval,
      faceEnhancement,
      fidelity: fidelity / 100,
      denoise,
      denoiseStrength,
      colorize,
    });
  }, [mode, scratchRemoval, faceEnhancement, fidelity, denoise, denoiseStrength, colorize]);

  const activeMode = MODES.find((m) => m.id === mode);

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Restoration Mode</p>
        <div className="grid grid-cols-3 gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`flex flex-col items-center gap-0.5 text-xs py-2 rounded transition-colors ${
                mode === m.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {activeMode && <p className="text-[10px] text-muted-foreground mt-1">{activeMode.desc}</p>}
      </div>

      <div className="border-t border-border pt-3" />

      {/* Feature toggles */}
      <div className="space-y-3">
        {/* Scratch Removal */}
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium">Scratch Removal</p>
            <p className="text-[10px] text-muted-foreground">
              Detect and repair scratches, tears, spots
            </p>
          </div>
          <input
            type="checkbox"
            checked={scratchRemoval}
            onChange={(e) => setScratchRemoval(e.target.checked)}
            className="h-4 w-4 rounded border-muted-foreground accent-primary"
          />
        </label>

        {/* Face Enhancement */}
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium">Face Enhancement</p>
            <p className="text-[10px] text-muted-foreground">
              Restore degraded faces with CodeFormer AI
            </p>
          </div>
          <input
            type="checkbox"
            checked={faceEnhancement}
            onChange={(e) => setFaceEnhancement(e.target.checked)}
            className="h-4 w-4 rounded border-muted-foreground accent-primary"
          />
        </label>

        {/* Fidelity slider (only when face enhancement is on) */}
        {faceEnhancement && (
          <div className="pl-2 border-l-2 border-primary/20">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Face Fidelity</p>
              <span className="text-xs font-mono tabular-nums">{fidelity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={fidelity}
              onChange={(e) => setFidelity(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-muted accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>Enhanced</span>
              <span>Faithful</span>
            </div>
          </div>
        )}

        {/* Noise Reduction */}
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium">Noise Reduction</p>
            <p className="text-[10px] text-muted-foreground">
              Remove grain and noise from old photos
            </p>
          </div>
          <input
            type="checkbox"
            checked={denoise}
            onChange={(e) => setDenoise(e.target.checked)}
            className="h-4 w-4 rounded border-muted-foreground accent-primary"
          />
        </label>

        {/* Denoise strength slider */}
        {denoise && (
          <div className="pl-2 border-l-2 border-primary/20">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Denoise Strength</p>
              <span className="text-xs font-mono tabular-nums">{denoiseStrength}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={denoiseStrength}
              onChange={(e) => setDenoiseStrength(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-muted accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>Subtle</span>
              <span>Strong</span>
            </div>
          </div>
        )}

        <div className="border-t border-border pt-3" />

        {/* Auto-Colorize */}
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium">Auto-Colorize</p>
            <p className="text-[10px] text-muted-foreground">
              Add color to B&W photos using DDColor AI
            </p>
          </div>
          <input
            type="checkbox"
            checked={colorize}
            onChange={(e) => setColorize(e.target.checked)}
            className="h-4 w-4 rounded border-muted-foreground accent-primary"
          />
        </label>
      </div>
    </div>
  );
}

export function RestorePhotoSettings() {
  const { files } = useFileStore();
  const {
    processFiles,
    processAllFiles,
    processing,
    error,
    downloadUrl,
    originalSize,
    processedSize,
    progress,
  } = useToolProcessor("restore-photo");
  const [settings, setSettings] = useState<Record<string, unknown>>({});

  const handleProcess = () => {
    if (files.length > 1) {
      processAllFiles(files, settings);
    } else {
      processFiles(files, settings);
    }
  };

  const hasFile = files.length > 0;
  const hasMultiple = files.length > 1;

  return (
    <div className="space-y-4">
      <RestorePhotoControls onChange={setSettings} />

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Size info */}
      {originalSize != null && processedSize != null && (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Original: {(originalSize / 1024).toFixed(1)} KB</p>
          <p>Restored: {(processedSize / 1024).toFixed(1)} KB</p>
        </div>
      )}

      {/* Process button / progress */}
      {processing ? (
        <ProgressCard
          active={processing}
          phase={progress.phase === "idle" ? "uploading" : progress.phase}
          label={hasMultiple ? `Restoring ${files.length} photos` : "Restoring photo"}
          percent={progress.percent}
          elapsed={progress.elapsed}
        />
      ) : (
        <button
          type="button"
          data-testid="restore-photo-submit"
          onClick={handleProcess}
          disabled={!hasFile || processing}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {hasMultiple ? `Restore Photos (${files.length})` : "Restore Photo"}
        </button>
      )}

      {/* Download (single file) */}
      {!hasMultiple && downloadUrl && (
        <a
          href={downloadUrl}
          download
          data-testid="restore-photo-download"
          className="w-full py-2.5 rounded-lg border border-primary text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      )}
    </div>
  );
}
