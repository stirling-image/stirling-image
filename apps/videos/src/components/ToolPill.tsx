import type React from "react";
import { COLOR } from "@/lib/colors";
import { TEXT } from "@/lib/fonts";

export const ToolPill: React.FC<{
  name: string;
  category: string;
  style?: React.CSSProperties;
}> = ({ name, category, style }) => {
  const color = COLOR.category[category] ?? COLOR.accent;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 12px",
        borderRadius: 6,
        backgroundColor: color,
        color: "white",
        ...TEXT.toolPill,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {name}
    </div>
  );
};
