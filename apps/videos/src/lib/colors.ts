export const COLOR = {
  accent: "#f59e0b",
  accentHover: "#d97706",
  dark: "#0c0a09",
  darkAlt: "#1a1a2e",
  light: "#ffffff",
  lightAlt: "#fafaf9",
  warmGradientFrom: "#f59e0b",
  warmGradientVia: "#f97316",
  warmGradientTo: "#ef4444",
  category: {
    essentials: "#3B82F6",
    optimization: "#10B981",
    adjustments: "#8B5CF6",
    watermark: "#EF4444",
    utilities: "#6366F1",
    layout: "#EC4899",
    format: "#14B8A6",
    ai: "#F59E0B",
  } as Record<string, string>,
  safe: "#22c55e",
  danger: "#ef4444",
  muted: "#737373",
  cloudRed: "#fef2f2",
  localGreen: "#f0fdf4",
};

export const CATEGORY_ORDER = [
  "essentials",
  "optimization",
  "adjustments",
  "ai",
  "watermark",
  "utilities",
  "layout",
  "format",
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  essentials: "Essentials",
  optimization: "Optimization",
  adjustments: "Adjustments",
  ai: "AI Tools",
  watermark: "Watermark",
  utilities: "Utilities",
  layout: "Layout",
  format: "Format",
};
