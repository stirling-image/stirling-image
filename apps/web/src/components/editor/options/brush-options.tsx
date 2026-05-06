// apps/web/src/components/editor/options/brush-options.tsx

import { useEditorStore } from "@/stores/editor-store";
import type { ToolType } from "@/types/editor";

const BRUSH_OPTION_TOOLS = new Set<ToolType>(["brush", "eraser", "pencil"]);

export function BrushOptions() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const brushSize = useEditorStore((s) => s.brushSize);
  const brushOpacity = useEditorStore((s) => s.brushOpacity);
  const brushHardness = useEditorStore((s) => s.brushHardness);
  const setBrushSize = useEditorStore((s) => s.setBrushSize);
  const setBrushOpacity = useEditorStore((s) => s.setBrushOpacity);
  const setBrushHardness = useEditorStore((s) => s.setBrushHardness);

  if (!BRUSH_OPTION_TOOLS.has(activeTool)) return null;

  return (
    <div className="flex items-center gap-3">
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

      {/* Opacity */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Opacity
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(brushOpacity * 100)}
          onChange={(e) => setBrushOpacity(Number(e.target.value) / 100)}
          className="w-20 h-1 accent-primary"
        />
        <input
          type="number"
          min={0}
          max={100}
          value={Math.round(brushOpacity * 100)}
          onChange={(e) => setBrushOpacity(Number(e.target.value) / 100)}
          className="w-12 h-6 text-xs text-center bg-muted border border-border rounded px-1"
        />
        <span className="text-[10px]">%</span>
      </label>

      {/* Hardness (not for pencil -- pencil is always hard) */}
      {activeTool !== "pencil" && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Hardness
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(brushHardness * 100)}
            onChange={(e) => setBrushHardness(Number(e.target.value) / 100)}
            className="w-20 h-1 accent-primary"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(brushHardness * 100)}
            onChange={(e) => setBrushHardness(Number(e.target.value) / 100)}
            className="w-12 h-6 text-xs text-center bg-muted border border-border rounded px-1"
          />
          <span className="text-[10px]">%</span>
        </label>
      )}
    </div>
  );
}
