// apps/web/src/components/editor/options/pixel-brush-options.tsx

import { useCallback, useState } from "react";
import { useEditorStore } from "@/stores/editor-store";
import type { ToolType } from "@/types/editor";
import { getPixelBrushStrength, setPixelBrushStrength } from "../tools/pixel-brush-tool";

const PIXEL_BRUSH_TOOLS = new Set<ToolType>(["blur-brush", "sharpen-brush", "smudge"]);

export function PixelBrushOptions() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setTool = useEditorStore((s) => s.setTool);
  const brushSize = useEditorStore((s) => s.brushSize);
  const setBrushSize = useEditorStore((s) => s.setBrushSize);
  const [strength, setLocalStrength] = useState(getPixelBrushStrength);

  const handleStrengthChange = useCallback((value: number) => {
    setPixelBrushStrength(value);
    setLocalStrength(value);
  }, []);

  if (!PIXEL_BRUSH_TOOLS.has(activeTool)) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Tool toggle */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Tool
        <select
          value={activeTool}
          onChange={(e) => setTool(e.target.value as ToolType)}
          className="h-6 text-xs bg-muted border border-border rounded px-1"
        >
          <option value="blur-brush">Blur</option>
          <option value="sharpen-brush">Sharpen</option>
          <option value="smudge">Smudge</option>
        </select>
      </label>

      {/* Size */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Size
        <input
          type="range"
          min={1}
          max={500}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-20 h-1 accent-primary"
        />
        <input
          type="number"
          min={1}
          max={500}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-12 h-6 text-xs text-center bg-muted border border-border rounded px-1"
        />
      </label>

      {/* Strength */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Strength
        <input
          type="range"
          min={1}
          max={100}
          value={strength}
          onChange={(e) => handleStrengthChange(Number(e.target.value))}
          className="w-20 h-1 accent-primary"
        />
        <input
          type="number"
          min={1}
          max={100}
          value={strength}
          onChange={(e) => handleStrengthChange(Number(e.target.value))}
          className="w-12 h-6 text-xs text-center bg-muted border border-border rounded px-1"
        />
        <span className="text-[10px]">%</span>
      </label>
    </div>
  );
}
