import { Download, Plus, Upload, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CollapsibleSection } from "@/components/common/collapsible-section";
import { ProgressCard } from "@/components/common/progress-card";
import { useToolProcessor } from "@/hooks/use-tool-processor";
import { formatHeaders } from "@/lib/api";
import { useFileStore } from "@/stores/file-store";

// -- Preset types -----------------------------------------------------------

interface GradientStop {
  color: string;
  position: number;
}

interface BeautifyPreset {
  name: string;
  backgroundType: string;
  backgroundColor: string;
  gradientStops: GradientStop[];
  gradientAngle: number;
  padding: number;
  borderRadius: number;
  shadowPreset: string;
  frame: string;
}

// -- Presets ----------------------------------------------------------------

const PRESETS: BeautifyPreset[] = [
  {
    name: "Purple Haze",
    backgroundType: "linear-gradient",
    backgroundColor: "#667eea",
    gradientStops: [
      { color: "#667eea", position: 0 },
      { color: "#764ba2", position: 100 },
    ],
    gradientAngle: 135,
    padding: 64,
    borderRadius: 12,
    shadowPreset: "subtle",
    frame: "macos-light",
  },
  {
    name: "Flamingo",
    backgroundType: "linear-gradient",
    backgroundColor: "#f093fb",
    gradientStops: [
      { color: "#f093fb", position: 0 },
      { color: "#f5576c", position: 100 },
    ],
    gradientAngle: 135,
    padding: 48,
    borderRadius: 12,
    shadowPreset: "medium",
    frame: "none",
  },
  {
    name: "Ocean",
    backgroundType: "linear-gradient",
    backgroundColor: "#4facfe",
    gradientStops: [
      { color: "#4facfe", position: 0 },
      { color: "#00f2fe", position: 100 },
    ],
    gradientAngle: 135,
    padding: 64,
    borderRadius: 12,
    shadowPreset: "subtle",
    frame: "browser-light",
  },
  {
    name: "Midnight",
    backgroundType: "linear-gradient",
    backgroundColor: "#0f0c29",
    gradientStops: [
      { color: "#0f0c29", position: 0 },
      { color: "#302b63", position: 50 },
      { color: "#24243e", position: 100 },
    ],
    gradientAngle: 135,
    padding: 80,
    borderRadius: 16,
    shadowPreset: "dramatic",
    frame: "macos-dark",
  },
  {
    name: "Mint",
    backgroundType: "linear-gradient",
    backgroundColor: "#43e97b",
    gradientStops: [
      { color: "#43e97b", position: 0 },
      { color: "#38f9d7", position: 100 },
    ],
    gradientAngle: 135,
    padding: 48,
    borderRadius: 12,
    shadowPreset: "subtle",
    frame: "none",
  },
  {
    name: "Sunset",
    backgroundType: "linear-gradient",
    backgroundColor: "#fa709a",
    gradientStops: [
      { color: "#fa709a", position: 0 },
      { color: "#fee140", position: 100 },
    ],
    gradientAngle: 135,
    padding: 64,
    borderRadius: 12,
    shadowPreset: "medium",
    frame: "none",
  },
  {
    name: "Clean White",
    backgroundType: "solid",
    backgroundColor: "#f8fafc",
    gradientStops: [
      { color: "#f8fafc", position: 0 },
      { color: "#f8fafc", position: 100 },
    ],
    gradientAngle: 135,
    padding: 64,
    borderRadius: 12,
    shadowPreset: "subtle",
    frame: "macos-light",
  },
  {
    name: "No Background",
    backgroundType: "transparent",
    backgroundColor: "#ffffff",
    gradientStops: [
      { color: "#ffffff", position: 0 },
      { color: "#ffffff", position: 100 },
    ],
    gradientAngle: 135,
    padding: 0,
    borderRadius: 0,
    shadowPreset: "none",
    frame: "none",
  },
];

// -- Helpers ----------------------------------------------------------------

const SHADOW_CSS: Record<string, string> = {
  subtle: "0px 4px 20px rgba(0,0,0,0.2)",
  medium: "0px 10px 40px rgba(0,0,0,0.35)",
  dramatic: "0px 20px 80px rgba(0,0,0,0.5)",
};

function buildPreviewStyle(settings: Record<string, unknown>): React.CSSProperties {
  const bg = settings.backgroundType as string;
  let background: string | undefined;

  if (bg === "solid") {
    background = settings.backgroundColor as string;
  } else if (bg === "linear-gradient") {
    const stops = settings.gradientStops as GradientStop[];
    const angle = settings.gradientAngle as number;
    background = `linear-gradient(${angle}deg, ${stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`;
  } else if (bg === "radial-gradient") {
    const stops = settings.gradientStops as GradientStop[];
    background = `radial-gradient(circle, ${stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`;
  }

  const shadowPreset = settings.shadowPreset as string;

  return {
    background,
    padding: `${settings.padding}px`,
    borderRadius: `${settings.borderRadius}px`,
    boxShadow: SHADOW_CSS[shadowPreset],
  };
}

function presetGradientCSS(preset: BeautifyPreset): string {
  if (preset.backgroundType === "transparent") return "transparent";
  if (preset.backgroundType === "solid") return preset.backgroundColor;
  const stops = preset.gradientStops.map((s) => `${s.color} ${s.position}%`).join(", ");
  return `linear-gradient(${preset.gradientAngle}deg, ${stops})`;
}

// -- Background tab types ---------------------------------------------------

type BackgroundTab = "linear-gradient" | "radial-gradient" | "solid" | "image" | "transparent";
type FrameType = "none" | "macos" | "windows" | "browser" | "iphone" | "macbook" | "ipad";
type FrameTheme = "light" | "dark";
type ShadowChip = "none" | "subtle" | "medium" | "dramatic" | "custom";
type SocialChip =
  | "none"
  | "twitter"
  | "linkedin"
  | "instagram-square"
  | "instagram-story"
  | "facebook"
  | "producthunt";

const BACKGROUND_TABS: { value: BackgroundTab; label: string }[] = [
  { value: "linear-gradient", label: "Gradient" },
  { value: "solid", label: "Solid" },
  { value: "image", label: "Image" },
  { value: "transparent", label: "None" },
];

const FRAME_TYPES: { value: FrameType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "macos", label: "macOS" },
  { value: "windows", label: "Windows" },
  { value: "browser", label: "Browser" },
  { value: "iphone", label: "iPhone" },
  { value: "macbook", label: "MacBook" },
  { value: "ipad", label: "iPad" },
];

const SHADOW_CHIPS: { value: ShadowChip; label: string }[] = [
  { value: "none", label: "None" },
  { value: "subtle", label: "Subtle" },
  { value: "medium", label: "Medium" },
  { value: "dramatic", label: "Dramatic" },
  { value: "custom", label: "Custom" },
];

const SOCIAL_CHIPS: { value: SocialChip; label: string }[] = [
  { value: "none", label: "Original" },
  { value: "twitter", label: "X/Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram-square", label: "IG Square" },
  { value: "instagram-story", label: "IG Story" },
  { value: "facebook", label: "Facebook" },
  { value: "producthunt", label: "Product Hunt" },
];

const WATERMARK_POSITIONS = [
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "center", label: "Center" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

// -- Controls ---------------------------------------------------------------

export interface BeautifyControlsProps {
  settings?: Record<string, unknown>;
  onChange?: (settings: Record<string, unknown>) => void;
  onImageStyle?: (style: React.CSSProperties | null) => void;
  onBackgroundImage?: (file: File | null) => void;
}

export function BeautifyControls({
  settings: initialSettings,
  onChange,
  onImageStyle,
  onBackgroundImage,
}: BeautifyControlsProps) {
  // State
  const [selectedPreset, setSelectedPreset] = useState<string | null>("Purple Haze");
  const [backgroundType, setBackgroundType] = useState<BackgroundTab>("linear-gradient");
  const [backgroundColor, setBackgroundColor] = useState("#667eea");
  const [gradientStops, setGradientStops] = useState<GradientStop[]>([
    { color: "#667eea", position: 0 },
    { color: "#764ba2", position: 100 },
  ]);
  const [gradientAngle, setGradientAngle] = useState(135);
  const [gradientMode, setGradientMode] = useState<"linear" | "radial">("linear");
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const [frameType, setFrameType] = useState<FrameType>("macos");
  const [frameTheme, setFrameTheme] = useState<FrameTheme>("light");
  const [frameTitle, setFrameTitle] = useState("");

  const [padding, setPadding] = useState(64);
  const [borderRadius, setBorderRadius] = useState(12);

  const [shadowPreset, setShadowPreset] = useState<ShadowChip>("subtle");
  const [shadowBlur, setShadowBlur] = useState(20);
  const [shadowOffsetX, setShadowOffsetX] = useState(0);
  const [shadowOffsetY, setShadowOffsetY] = useState(10);
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowOpacity, setShadowOpacity] = useState(30);

  const [socialPreset, setSocialPreset] = useState<SocialChip>("none");

  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkPosition, setWatermarkPosition] = useState("bottom-right");
  const [watermarkOpacity, setWatermarkOpacity] = useState(50);

  // Initialize from external settings
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initialSettings || initializedRef.current) return;
    initializedRef.current = true;
    if (initialSettings.backgroundType != null)
      setBackgroundType(initialSettings.backgroundType as BackgroundTab);
    if (initialSettings.backgroundColor != null)
      setBackgroundColor(String(initialSettings.backgroundColor));
    if (initialSettings.gradientStops != null)
      setGradientStops(initialSettings.gradientStops as GradientStop[]);
    if (initialSettings.gradientAngle != null)
      setGradientAngle(Number(initialSettings.gradientAngle));
    if (initialSettings.padding != null) setPadding(Number(initialSettings.padding));
    if (initialSettings.borderRadius != null) setBorderRadius(Number(initialSettings.borderRadius));
    if (initialSettings.shadowPreset != null)
      setShadowPreset(initialSettings.shadowPreset as ShadowChip);
  }, [initialSettings]);

  // Refs for stable callbacks
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const onImageStyleRef = useRef(onImageStyle);
  useEffect(() => {
    onImageStyleRef.current = onImageStyle;
  });

  const onBgImageRef = useRef(onBackgroundImage);
  useEffect(() => {
    onBgImageRef.current = onBackgroundImage;
  });

  // Resolve frame string from type + theme
  const resolvedFrame = frameType === "none" ? "none" : (`${frameType}-${frameTheme}` as const);

  // Resolve background type from tab + gradient mode
  const resolvedBgType: string =
    backgroundType === "linear-gradient" || backgroundType === "radial-gradient"
      ? gradientMode === "radial"
        ? "radial-gradient"
        : "linear-gradient"
      : backgroundType;

  // Propagate changes
  useEffect(() => {
    const vals: Record<string, unknown> = {
      backgroundType: resolvedBgType,
      backgroundColor,
      gradientStops,
      gradientAngle,
      padding,
      borderRadius,
      shadowPreset,
      shadowBlur,
      shadowOffsetX,
      shadowOffsetY,
      shadowColor,
      shadowOpacity,
      frame: resolvedFrame,
      frameTitle: frameTitle || undefined,
      socialPreset,
      watermarkText: watermarkText || undefined,
      watermarkPosition,
      watermarkOpacity,
    };
    onChangeRef.current?.(vals);
    onImageStyleRef.current?.(buildPreviewStyle(vals));
  }, [
    resolvedBgType,
    backgroundColor,
    gradientStops,
    gradientAngle,
    padding,
    borderRadius,
    shadowPreset,
    shadowBlur,
    shadowOffsetX,
    shadowOffsetY,
    shadowColor,
    shadowOpacity,
    resolvedFrame,
    frameTitle,
    socialPreset,
    watermarkText,
    watermarkPosition,
    watermarkOpacity,
  ]);

  const clearPreset = () => setSelectedPreset(null);

  const applyPreset = (preset: BeautifyPreset) => {
    setSelectedPreset(preset.name);
    const bgTab: BackgroundTab =
      preset.backgroundType === "radial-gradient"
        ? "linear-gradient"
        : (preset.backgroundType as BackgroundTab);
    setBackgroundType(bgTab);
    setGradientMode(preset.backgroundType === "radial-gradient" ? "radial" : "linear");
    setBackgroundColor(preset.backgroundColor);
    setGradientStops(preset.gradientStops);
    setGradientAngle(preset.gradientAngle);
    setPadding(preset.padding);
    setBorderRadius(preset.borderRadius);
    setShadowPreset(preset.shadowPreset as ShadowChip);

    // Parse frame into type + theme
    if (preset.frame === "none") {
      setFrameType("none");
    } else {
      const parts = preset.frame.split("-");
      const theme = parts.pop() as FrameTheme;
      const type = parts.join("-") as FrameType;
      setFrameType(type);
      setFrameTheme(theme);
    }
  };

  const handleStopColorChange = (index: number, color: string) => {
    clearPreset();
    setGradientStops((prev) => prev.map((s, i) => (i === index ? { ...s, color } : s)));
  };

  const handleAddStop = () => {
    clearPreset();
    setGradientStops((prev) => [...prev, { color: "#ffffff", position: 50 }]);
  };

  const handleRemoveStop = (index: number) => {
    if (gradientStops.length <= 2) return;
    clearPreset();
    setGradientStops((prev) => prev.filter((_, i) => i !== index));
  };

  const hasFrameTitle = frameType === "macos" || frameType === "windows" || frameType === "browser";

  return (
    <div className="space-y-3">
      {/* 1. Quick Presets */}
      <CollapsibleSection title="Quick Presets" defaultOpen>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded transition-colors ${
                selectedPreset === preset.name
                  ? "bg-primary/10 ring-1 ring-primary"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <div
                className="w-full h-5 rounded-sm border border-border/50"
                style={{ background: presetGradientCSS(preset) }}
              />
              <span className="text-[10px] text-muted-foreground leading-tight truncate w-full text-center">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* 2. Background */}
      <CollapsibleSection title="Background" defaultOpen>
        <div className="space-y-3">
          {/* Tab buttons */}
          <div className="flex gap-1">
            {BACKGROUND_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  clearPreset();
                  setBackgroundType(tab.value);
                  if (tab.value === "linear-gradient" || tab.value === "radial-gradient") {
                    setGradientMode("linear");
                  }
                }}
                className={`flex-1 text-[11px] py-1.5 rounded transition-colors ${
                  (backgroundType === "linear-gradient" || backgroundType === "radial-gradient") &&
                  (tab.value === "linear-gradient" || tab.value === "radial-gradient")
                    ? "bg-primary text-primary-foreground"
                    : backgroundType === tab.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Gradient mode */}
          {(backgroundType === "linear-gradient" || backgroundType === "radial-gradient") && (
            <div className="space-y-3">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    clearPreset();
                    setGradientMode("linear");
                  }}
                  className={`flex-1 text-[11px] py-1 rounded transition-colors ${
                    gradientMode === "linear"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Linear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearPreset();
                    setGradientMode("radial");
                  }}
                  className={`flex-1 text-[11px] py-1 rounded transition-colors ${
                    gradientMode === "radial"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Radial
                </button>
              </div>

              {/* Color stops */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Color Stops</p>
                {gradientStops.map((stop, i) => (
                  <div key={`${stop.color}-${stop.position}`} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => handleStopColorChange(i, e.target.value)}
                      className="h-6 w-6 rounded border border-border cursor-pointer appearance-none bg-transparent shrink-0"
                    />
                    <span className="text-[11px] text-muted-foreground font-mono w-16">
                      {stop.color}
                    </span>
                    {gradientStops.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(i)}
                        className="ml-auto p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddStop}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add Stop
                </button>
              </div>

              {/* Angle (linear only) */}
              {gradientMode === "linear" && (
                <div>
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="beautify-gradient-angle"
                      className="text-xs text-muted-foreground"
                    >
                      Angle
                    </label>
                    <span className="text-xs font-mono text-foreground">{gradientAngle}deg</span>
                  </div>
                  <input
                    id="beautify-gradient-angle"
                    type="range"
                    min={0}
                    max={360}
                    value={gradientAngle}
                    onChange={(e) => {
                      clearPreset();
                      setGradientAngle(Number(e.target.value));
                    }}
                    className="w-full mt-1"
                  />
                </div>
              )}
            </div>
          )}

          {/* Solid mode */}
          {backgroundType === "solid" && (
            <div>
              <label htmlFor="beautify-bg-color" className="text-xs text-muted-foreground">
                Color
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="beautify-bg-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => {
                    clearPreset();
                    setBackgroundColor(e.target.value);
                  }}
                  className="h-6 w-6 rounded border border-border cursor-pointer appearance-none bg-transparent"
                />
                <span className="text-[11px] text-muted-foreground font-mono">
                  {backgroundColor}
                </span>
              </div>
            </div>
          )}

          {/* Image mode */}
          {backgroundType === "image" && (
            <div>
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*,.heic,.heif,.hif"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setBgImageFile(file);
                  onBgImageRef.current?.(file);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bgInputRef.current?.click()}
                className="w-full px-2 py-2 rounded border border-dashed border-border bg-background text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {bgImageFile ? bgImageFile.name : "Choose background image"}
              </button>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* 3. Device Frame */}
      <CollapsibleSection title="Device Frame" defaultOpen>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-1">
            {FRAME_TYPES.map((ft) => (
              <button
                key={ft.value}
                type="button"
                onClick={() => {
                  clearPreset();
                  setFrameType(ft.value);
                }}
                className={`text-[11px] py-1.5 rounded transition-colors ${
                  frameType === ft.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {ft.label}
              </button>
            ))}
          </div>

          {frameType !== "none" && (
            <>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    clearPreset();
                    setFrameTheme("light");
                  }}
                  className={`flex-1 text-[11px] py-1 rounded transition-colors ${
                    frameTheme === "light"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearPreset();
                    setFrameTheme("dark");
                  }}
                  className={`flex-1 text-[11px] py-1 rounded transition-colors ${
                    frameTheme === "dark"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dark
                </button>
              </div>

              {hasFrameTitle && (
                <div>
                  <label htmlFor="beautify-frame-title" className="text-xs text-muted-foreground">
                    Title
                  </label>
                  <input
                    id="beautify-frame-title"
                    type="text"
                    value={frameTitle}
                    onChange={(e) => setFrameTitle(e.target.value)}
                    placeholder="Window title"
                    className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </CollapsibleSection>

      {/* 4. Spacing */}
      <CollapsibleSection title="Spacing" defaultOpen>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="beautify-padding" className="text-xs text-muted-foreground">
                Padding
              </label>
              <span className="text-xs font-mono text-foreground">{padding}px</span>
            </div>
            <input
              id="beautify-padding"
              type="range"
              min={0}
              max={256}
              value={padding}
              onChange={(e) => {
                clearPreset();
                setPadding(Number(e.target.value));
              }}
              className="w-full mt-1"
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="beautify-border-radius" className="text-xs text-muted-foreground">
                Border Radius
              </label>
              <span className="text-xs font-mono text-foreground">{borderRadius}px</span>
            </div>
            <input
              id="beautify-border-radius"
              type="range"
              min={0}
              max={64}
              value={borderRadius}
              onChange={(e) => {
                clearPreset();
                setBorderRadius(Number(e.target.value));
              }}
              className="w-full mt-1"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 5. Shadow */}
      <CollapsibleSection title="Shadow" defaultOpen>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {SHADOW_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => {
                  clearPreset();
                  setShadowPreset(chip.value);
                }}
                className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                  shadowPreset === chip.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {shadowPreset === "custom" && (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="beautify-shadow-blur" className="text-xs text-muted-foreground">
                    Blur
                  </label>
                  <span className="text-xs font-mono text-foreground">{shadowBlur}px</span>
                </div>
                <input
                  id="beautify-shadow-blur"
                  type="range"
                  min={0}
                  max={100}
                  value={shadowBlur}
                  onChange={(e) => setShadowBlur(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="beautify-shadow-x" className="text-xs text-muted-foreground">
                      Offset X
                    </label>
                    <span className="text-xs font-mono text-foreground">{shadowOffsetX}</span>
                  </div>
                  <input
                    id="beautify-shadow-x"
                    type="range"
                    min={-50}
                    max={50}
                    value={shadowOffsetX}
                    onChange={(e) => setShadowOffsetX(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="beautify-shadow-y" className="text-xs text-muted-foreground">
                      Offset Y
                    </label>
                    <span className="text-xs font-mono text-foreground">{shadowOffsetY}</span>
                  </div>
                  <input
                    id="beautify-shadow-y"
                    type="range"
                    min={-50}
                    max={50}
                    value={shadowOffsetY}
                    onChange={(e) => setShadowOffsetY(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="beautify-shadow-color" className="text-xs text-muted-foreground">
                  Color
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="beautify-shadow-color"
                    type="color"
                    value={shadowColor}
                    onChange={(e) => setShadowColor(e.target.value)}
                    className="h-6 w-6 rounded border border-border cursor-pointer appearance-none bg-transparent"
                  />
                  <span className="text-[11px] text-muted-foreground font-mono">{shadowColor}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="beautify-shadow-opacity"
                    className="text-xs text-muted-foreground"
                  >
                    Opacity
                  </label>
                  <span className="text-xs font-mono text-foreground">{shadowOpacity}%</span>
                </div>
                <input
                  id="beautify-shadow-opacity"
                  type="range"
                  min={0}
                  max={100}
                  value={shadowOpacity}
                  onChange={(e) => setShadowOpacity(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* 6. Export Size */}
      <CollapsibleSection title="Export Size">
        <div className="flex flex-wrap gap-1">
          {SOCIAL_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => {
                clearPreset();
                setSocialPreset(chip.value);
              }}
              className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                socialPreset === chip.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* 7. Watermark */}
      <CollapsibleSection title="Watermark">
        <div className="space-y-3">
          <div>
            <label htmlFor="beautify-watermark-text" className="text-xs text-muted-foreground">
              Text
            </label>
            <input
              id="beautify-watermark-text"
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Your watermark text"
              className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
            />
          </div>

          <div>
            <label htmlFor="beautify-watermark-position" className="text-xs text-muted-foreground">
              Position
            </label>
            <select
              id="beautify-watermark-position"
              value={watermarkPosition}
              onChange={(e) => setWatermarkPosition(e.target.value)}
              className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
            >
              {WATERMARK_POSITIONS.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="beautify-watermark-opacity" className="text-xs text-muted-foreground">
                Opacity
              </label>
              <span className="text-xs font-mono text-foreground">{watermarkOpacity}%</span>
            </div>
            <input
              id="beautify-watermark-opacity"
              type="range"
              min={0}
              max={100}
              value={watermarkOpacity}
              onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
              className="w-full mt-1"
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

// -- Settings Panel ---------------------------------------------------------

export function BeautifySettings({
  onImageStyle,
}: {
  onImageStyle?: (style: React.CSSProperties | null) => void;
}) {
  const { files, setProcessedUrl, setSizes, setJobId } = useFileStore();
  const { processFiles, processAllFiles, processing, error, downloadUrl, progress } =
    useToolProcessor("beautify");

  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [manualDownloadUrl, setManualDownloadUrl] = useState<string | null>(null);
  const [manualProcessing, setManualProcessing] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const handleSettingsChange = useCallback((s: Record<string, unknown>) => {
    setSettings(s);
  }, []);

  const handleBgImageChange = useCallback((file: File | null) => {
    setBgImageFile(file);
  }, []);

  const hasFile = files.length > 0;
  const isImageBg = settings.backgroundType === "image";
  const isProcessing = processing || manualProcessing;
  const displayError = error || manualError;
  const displayDownloadUrl = manualDownloadUrl || downloadUrl;

  const handleProcess = async () => {
    if (!hasFile) return;

    // For image background mode, use manual FormData (like compose-settings)
    if (isImageBg && bgImageFile) {
      setManualProcessing(true);
      setManualError(null);
      setManualDownloadUrl(null);

      try {
        const formData = new FormData();
        formData.append("file", files[0]);
        formData.append("backgroundImage", bgImageFile);
        formData.append("settings", JSON.stringify(settings));

        const res = await fetch("/api/v1/tools/beautify", {
          method: "POST",
          headers: formatHeaders(),
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Processing failed: ${res.status}`);
        }

        const result = await res.json();
        setJobId(result.jobId);
        setProcessedUrl(result.downloadUrl);
        setManualDownloadUrl(result.downloadUrl);
        setSizes(result.originalSize, result.processedSize);
      } catch (err) {
        setManualError(err instanceof Error ? err.message : "Processing failed");
      } finally {
        setManualProcessing(false);
      }
      return;
    }

    // Standard processing via useToolProcessor
    if (files.length > 1) {
      processAllFiles(files, settings);
    } else {
      processFiles(files, settings);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasFile && !isProcessing) handleProcess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <BeautifyControls
        onChange={handleSettingsChange}
        onImageStyle={onImageStyle}
        onBackgroundImage={handleBgImageChange}
      />

      {displayError && <p className="text-xs text-red-500">{displayError}</p>}

      {processing ? (
        <ProgressCard
          active={processing}
          phase={progress.phase === "idle" ? "uploading" : progress.phase}
          label="Beautifying screenshot"
          stage={progress.stage}
          percent={progress.percent}
          elapsed={progress.elapsed}
        />
      ) : (
        <button
          type="submit"
          data-testid="beautify-submit"
          disabled={!hasFile || isProcessing}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {manualProcessing
            ? "Processing..."
            : files.length > 1
              ? `Beautify (${files.length} files)`
              : "Beautify"}
        </button>
      )}

      {displayDownloadUrl && (
        <a
          href={displayDownloadUrl}
          download
          data-testid="beautify-download"
          className="w-full py-2.5 rounded-lg border border-primary text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      )}
    </form>
  );
}
