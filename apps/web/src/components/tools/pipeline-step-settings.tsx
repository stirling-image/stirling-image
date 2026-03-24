type FieldType = "number" | "select" | "boolean" | "text" | "color";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
  showWhen?: (settings: Record<string, unknown>) => boolean;
}

const TOOL_FIELDS: Record<string, FieldDef[]> = {
  resize: [
    { key: "width", label: "Width (px)", type: "number", min: 1, placeholder: "Auto" },
    { key: "height", label: "Height (px)", type: "number", min: 1, placeholder: "Auto" },
    { key: "percentage", label: "Scale (%)", type: "number", min: 1, placeholder: "Use instead of width/height" },
    {
      key: "fit",
      label: "Fit Mode",
      type: "select",
      defaultValue: "contain",
      options: [
        { value: "contain", label: "Fit inside" },
        { value: "cover", label: "Crop to fit" },
        { value: "fill", label: "Stretch" },
      ],
    },
    { key: "withoutEnlargement", label: "Don't enlarge", type: "boolean", defaultValue: false },
  ],

  crop: [
    { key: "left", label: "Left offset (px)", type: "number", min: 0, placeholder: "0" },
    { key: "top", label: "Top offset (px)", type: "number", min: 0, placeholder: "0" },
    { key: "width", label: "Width (px)", type: "number", min: 1, placeholder: "Required" },
    { key: "height", label: "Height (px)", type: "number", min: 1, placeholder: "Required" },
  ],

  rotate: [
    { key: "angle", label: "Angle (degrees)", type: "number", min: -360, max: 360, step: 90, defaultValue: 0 },
    { key: "horizontal", label: "Flip horizontal", type: "boolean", defaultValue: false },
    { key: "vertical", label: "Flip vertical", type: "boolean", defaultValue: false },
  ],

  convert: [
    {
      key: "format",
      label: "Format",
      type: "select",
      options: [
        { value: "jpg", label: "JPEG" },
        { value: "png", label: "PNG" },
        { value: "webp", label: "WebP" },
        { value: "avif", label: "AVIF" },
        { value: "tiff", label: "TIFF" },
        { value: "gif", label: "GIF" },
      ],
    },
    { key: "quality", label: "Quality (1-100)", type: "number", min: 1, max: 100, placeholder: "Auto" },
  ],

  compress: [
    {
      key: "mode",
      label: "Mode",
      type: "select",
      defaultValue: "quality",
      options: [
        { value: "quality", label: "Quality" },
        { value: "targetSize", label: "Target size" },
      ],
    },
    {
      key: "quality",
      label: "Quality (1-100)",
      type: "number",
      min: 1,
      max: 100,
      placeholder: "80",
      showWhen: (s) => s.mode !== "targetSize",
    },
    {
      key: "targetSizeKb",
      label: "Target size (KB)",
      type: "number",
      min: 1,
      placeholder: "e.g. 200",
      showWhen: (s) => s.mode === "targetSize",
    },
  ],

  "strip-metadata": [
    { key: "stripAll", label: "Strip all metadata", type: "boolean", defaultValue: true },
    {
      key: "stripExif",
      label: "Strip EXIF",
      type: "boolean",
      defaultValue: false,
      showWhen: (s) => !s.stripAll,
    },
    {
      key: "stripGps",
      label: "Strip GPS",
      type: "boolean",
      defaultValue: false,
      showWhen: (s) => !s.stripAll,
    },
    {
      key: "stripIcc",
      label: "Strip ICC profile",
      type: "boolean",
      defaultValue: false,
      showWhen: (s) => !s.stripAll,
    },
    {
      key: "stripXmp",
      label: "Strip XMP",
      type: "boolean",
      defaultValue: false,
      showWhen: (s) => !s.stripAll,
    },
  ],

  "brightness-contrast": [
    { key: "brightness", label: "Brightness", type: "number", min: -100, max: 100, defaultValue: 0 },
    { key: "contrast", label: "Contrast", type: "number", min: -100, max: 100, defaultValue: 0 },
  ],

  saturation: [
    { key: "saturation", label: "Saturation", type: "number", min: -100, max: 100, defaultValue: 0 },
  ],

  "color-channels": [
    { key: "red", label: "Red", type: "number", min: 0, max: 200, defaultValue: 100 },
    { key: "green", label: "Green", type: "number", min: 0, max: 200, defaultValue: 100 },
    { key: "blue", label: "Blue", type: "number", min: 0, max: 200, defaultValue: 100 },
  ],

  "color-effects": [
    {
      key: "effect",
      label: "Effect",
      type: "select",
      defaultValue: "none",
      options: [
        { value: "none", label: "None" },
        { value: "grayscale", label: "Grayscale" },
        { value: "sepia", label: "Sepia" },
        { value: "invert", label: "Invert" },
      ],
    },
  ],

  "replace-color": [
    { key: "sourceColor", label: "Source color", type: "color", defaultValue: "#FF0000" },
    { key: "targetColor", label: "Target color", type: "color", defaultValue: "#00FF00" },
    { key: "makeTransparent", label: "Make transparent instead", type: "boolean", defaultValue: false },
    { key: "tolerance", label: "Tolerance (0-255)", type: "number", min: 0, max: 255, defaultValue: 30 },
  ],

  "watermark-text": [
    { key: "text", label: "Watermark text", type: "text", placeholder: "Your watermark" },
    { key: "fontSize", label: "Font size", type: "number", min: 8, max: 200, defaultValue: 48 },
    { key: "color", label: "Color", type: "color", defaultValue: "#000000" },
    { key: "opacity", label: "Opacity (%)", type: "number", min: 0, max: 100, defaultValue: 50 },
    {
      key: "position",
      label: "Position",
      type: "select",
      defaultValue: "center",
      options: [
        { value: "center", label: "Center" },
        { value: "top-left", label: "Top left" },
        { value: "top-right", label: "Top right" },
        { value: "bottom-left", label: "Bottom left" },
        { value: "bottom-right", label: "Bottom right" },
        { value: "tiled", label: "Tiled" },
      ],
    },
    { key: "rotation", label: "Rotation (degrees)", type: "number", min: -360, max: 360, defaultValue: 0 },
  ],

  "watermark-image": [
    {
      key: "position",
      label: "Position",
      type: "select",
      defaultValue: "bottom-right",
      options: [
        { value: "center", label: "Center" },
        { value: "top-left", label: "Top left" },
        { value: "top-right", label: "Top right" },
        { value: "bottom-left", label: "Bottom left" },
        { value: "bottom-right", label: "Bottom right" },
      ],
    },
    { key: "opacity", label: "Opacity (%)", type: "number", min: 0, max: 100, defaultValue: 50 },
    { key: "scale", label: "Scale (%)", type: "number", min: 1, max: 100, defaultValue: 25 },
  ],

  "text-overlay": [
    { key: "text", label: "Text", type: "text", placeholder: "Your text" },
    { key: "fontSize", label: "Font size", type: "number", min: 8, max: 200, defaultValue: 48 },
    { key: "color", label: "Color", type: "color", defaultValue: "#FFFFFF" },
    {
      key: "position",
      label: "Position",
      type: "select",
      defaultValue: "bottom",
      options: [
        { value: "top", label: "Top" },
        { value: "center", label: "Center" },
        { value: "bottom", label: "Bottom" },
      ],
    },
    { key: "backgroundBox", label: "Background box", type: "boolean", defaultValue: false },
    {
      key: "backgroundColor",
      label: "Box color",
      type: "color",
      defaultValue: "#000000",
      showWhen: (s) => !!s.backgroundBox,
    },
    { key: "shadow", label: "Text shadow", type: "boolean", defaultValue: true },
  ],

  border: [
    { key: "borderWidth", label: "Width (px)", type: "number", min: 0, max: 200, defaultValue: 10 },
    { key: "borderColor", label: "Color", type: "color", defaultValue: "#000000" },
    { key: "cornerRadius", label: "Corner radius", type: "number", min: 0, max: 500, defaultValue: 0 },
    { key: "padding", label: "Padding (px)", type: "number", min: 0, max: 200, defaultValue: 0 },
    { key: "shadowBlur", label: "Shadow blur", type: "number", min: 0, max: 50, defaultValue: 0 },
    { key: "shadowColor", label: "Shadow color", type: "color", defaultValue: "#00000080" },
  ],

  split: [
    { key: "columns", label: "Columns", type: "number", min: 1, max: 10, defaultValue: 2 },
    { key: "rows", label: "Rows", type: "number", min: 1, max: 10, defaultValue: 2 },
  ],

  "blur-faces": [
    { key: "blurRadius", label: "Blur radius", type: "number", min: 1, max: 100, defaultValue: 30 },
    { key: "sensitivity", label: "Sensitivity (0-1)", type: "number", min: 0, max: 1, step: 0.1, defaultValue: 0.5 },
  ],

  upscale: [
    {
      key: "scale",
      label: "Scale factor",
      type: "select",
      defaultValue: "2",
      options: [
        { value: "2", label: "2x" },
        { value: "3", label: "3x" },
        { value: "4", label: "4x" },
      ],
    },
  ],

  "smart-crop": [
    { key: "width", label: "Width (px)", type: "number", min: 1, placeholder: "Required" },
    { key: "height", label: "Height (px)", type: "number", min: 1, placeholder: "Required" },
  ],

  vectorize: [
    {
      key: "colorMode",
      label: "Color mode",
      type: "select",
      defaultValue: "bw",
      options: [
        { value: "bw", label: "Black & White" },
        { value: "color", label: "Color" },
      ],
    },
    { key: "threshold", label: "Threshold (0-255)", type: "number", min: 0, max: 255, defaultValue: 128 },
    {
      key: "detail",
      label: "Detail",
      type: "select",
      defaultValue: "medium",
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ],
    },
  ],

  "svg-to-raster": [
    { key: "width", label: "Width (px)", type: "number", min: 1, max: 8192, defaultValue: 1024 },
    { key: "height", label: "Height (px)", type: "number", min: 1, max: 8192, placeholder: "Auto" },
    {
      key: "outputFormat",
      label: "Format",
      type: "select",
      defaultValue: "png",
      options: [
        { value: "png", label: "PNG" },
        { value: "jpg", label: "JPEG" },
        { value: "webp", label: "WebP" },
      ],
    },
  ],

  "gif-tools": [
    { key: "width", label: "Width (px)", type: "number", min: 1, max: 4096, placeholder: "Auto" },
    { key: "height", label: "Height (px)", type: "number", min: 1, max: 4096, placeholder: "Auto" },
    { key: "extractFrame", label: "Extract frame #", type: "number", min: 0, placeholder: "All frames" },
    { key: "optimize", label: "Optimize", type: "boolean", defaultValue: false },
  ],

  "image-to-pdf": [
    {
      key: "pageSize",
      label: "Page size",
      type: "select",
      defaultValue: "A4",
      options: [
        { value: "A4", label: "A4" },
        { value: "Letter", label: "Letter" },
        { value: "A3", label: "A3" },
        { value: "A5", label: "A5" },
      ],
    },
    {
      key: "orientation",
      label: "Orientation",
      type: "select",
      defaultValue: "portrait",
      options: [
        { value: "portrait", label: "Portrait" },
        { value: "landscape", label: "Landscape" },
      ],
    },
    { key: "margin", label: "Margin (mm)", type: "number", min: 0, max: 100, defaultValue: 20 },
  ],

  "bulk-rename": [
    { key: "pattern", label: "Pattern", type: "text", placeholder: "image-{{index}}", defaultValue: "image-{{index}}" },
    { key: "startIndex", label: "Start index", type: "number", min: 0, defaultValue: 1 },
  ],

  ocr: [
    {
      key: "engine",
      label: "Engine",
      type: "select",
      defaultValue: "tesseract",
      options: [
        { value: "tesseract", label: "Tesseract" },
        { value: "paddleocr", label: "PaddleOCR" },
      ],
    },
    {
      key: "language",
      label: "Language",
      type: "select",
      defaultValue: "en",
      options: [
        { value: "en", label: "English" },
        { value: "de", label: "German" },
        { value: "fr", label: "French" },
        { value: "es", label: "Spanish" },
        { value: "zh", label: "Chinese" },
        { value: "ja", label: "Japanese" },
        { value: "ko", label: "Korean" },
      ],
    },
  ],

  "qr-generate": [
    { key: "text", label: "Content", type: "text", placeholder: "URL or text" },
    { key: "size", label: "Size (px)", type: "number", min: 100, max: 2000, defaultValue: 400 },
    {
      key: "errorCorrection",
      label: "Error correction",
      type: "select",
      defaultValue: "M",
      options: [
        { value: "L", label: "Low (7%)" },
        { value: "M", label: "Medium (15%)" },
        { value: "Q", label: "Quartile (25%)" },
        { value: "H", label: "High (30%)" },
      ],
    },
    { key: "foreground", label: "Foreground", type: "color", defaultValue: "#000000" },
    { key: "background", label: "Background", type: "color", defaultValue: "#FFFFFF" },
  ],

  "remove-background": [],
  favicon: [],
  "color-palette": [],
  "barcode-read": [],
  info: [],
  "erase-object": [],
};

interface PipelineStepSettingsProps {
  toolId: string;
  settings: Record<string, unknown>;
  onChange: (settings: Record<string, unknown>) => void;
}

export function PipelineStepSettings({ toolId, settings, onChange }: PipelineStepSettingsProps) {
  const fields = TOOL_FIELDS[toolId];

  if (!fields || fields.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No configurable settings. Defaults will be used.
      </p>
    );
  }

  const updateField = (key: string, value: unknown) => {
    const next = { ...settings };
    if (value === undefined || value === "") {
      delete next[key];
    } else {
      next[key] = value;
    }
    onChange(next);
  };

  const visibleFields = fields.filter((f) => !f.showWhen || f.showWhen(settings));

  return (
    <div className="space-y-3">
      {visibleFields.map((field) => {
        const raw = settings[field.key];
        const value = raw !== undefined ? raw : field.defaultValue;

        switch (field.type) {
          case "number":
            return (
              <div key={field.key}>
                <label className="text-xs text-muted-foreground">{field.label}</label>
                <input
                  type="number"
                  value={value != null && value !== "" ? Number(value) : ""}
                  onChange={(e) =>
                    updateField(field.key, e.target.value === "" ? undefined : Number(e.target.value))
                  }
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  placeholder={field.placeholder}
                  className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
                />
              </div>
            );

          case "text":
            return (
              <div key={field.key}>
                <label className="text-xs text-muted-foreground">{field.label}</label>
                <input
                  type="text"
                  value={String(value ?? "")}
                  onChange={(e) => updateField(field.key, e.target.value || undefined)}
                  placeholder={field.placeholder}
                  className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
                />
              </div>
            );

          case "select": {
            const opts = field.options!;
            // Use button group for <= 4 options, dropdown for more
            if (opts.length <= 4) {
              return (
                <div key={field.key}>
                  <label className="text-xs text-muted-foreground">{field.label}</label>
                  <div className="flex gap-1 mt-0.5">
                    {opts.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateField(field.key, opt.value)}
                        className={`flex-1 text-xs py-1.5 rounded transition-colors ${
                          String(value) === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <div key={field.key}>
                <label className="text-xs text-muted-foreground">{field.label}</label>
                <select
                  value={String(value ?? "")}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
                >
                  {!value && <option value="">Select...</option>}
                  {opts.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          case "boolean":
            return (
              <label key={field.key} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => updateField(field.key, e.target.checked)}
                  className="rounded"
                />
                {field.label}
              </label>
            );

          case "color":
            return (
              <div key={field.key}>
                <label className="text-xs text-muted-foreground">{field.label}</label>
                <div className="flex gap-2 mt-0.5">
                  <input
                    type="color"
                    value={String(value || "#000000").slice(0, 7)}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="h-8 w-8 rounded border border-border cursor-pointer bg-background"
                  />
                  <input
                    type="text"
                    value={String(value ?? "")}
                    onChange={(e) => updateField(field.key, e.target.value || undefined)}
                    placeholder="#000000"
                    className="flex-1 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground font-mono"
                  />
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
