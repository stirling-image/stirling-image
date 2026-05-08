import type React from "react";

export const PhotoPlaceholder: React.FC<{
  width: number;
  height: number;
  hue?: number;
  style?: React.CSSProperties;
}> = ({ width, height, hue = 30, style }) => (
  <div
    style={{
      width,
      height,
      borderRadius: 8,
      background: `linear-gradient(135deg, hsl(${hue}, 60%, 65%) 0%, hsl(${hue + 30}, 50%, 55%) 100%)`,
      border: "1.5px solid rgba(255,255,255,0.15)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      ...style,
    }}
  />
);
