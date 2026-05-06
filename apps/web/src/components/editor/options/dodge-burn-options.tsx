// apps/web/src/components/editor/options/dodge-burn-options.tsx

import { useEditorStore } from "@/stores/editor-store";
import type { ToolType } from "@/types/editor";

const DODGE_BURN_TOOLS = new Set<ToolType>(["dodge", "burn", "sponge"]);

export function DodgeBurnOptions() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setTool = useEditorStore((s) => s.setTool);
  const brushSize = useEditorStore((s) => s.brushSize);
  const setBrushSize = useEditorStore((s) => s.setBrushSize);
  const dodgeBurnRange = useEditorStore((s) => s.dodgeBurnRange);
  const dodgeBurnExposure = useEditorStore((s) => s.dodgeBurnExposure);
  const spongeMode = useEditorStore((s) => s.spongeMode);
  const spongeFlow = useEditorStore((s) => s.spongeFlow);

  if (!DODGE_BURN_TOOLS.has(activeTool)) return null;

  const isDodgeBurn = activeTool === "dodge" || activeTool === "burn";

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
          <option value="dodge">Dodge</option>
          <option value="burn">Burn</option>
          <option value="sponge">Sponge</option>
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
          className="w-16 h-1 accent-primary"
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

      {/* Range (dodge/burn only) */}
      {isDodgeBurn && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Range
          <select
            value={dodgeBurnRange}
            onChange={(e) =>
              useEditorStore.setState({
                dodgeBurnRange: e.target.value as "shadows" | "midtones" | "highlights",
              })
            }
            className="h-6 text-xs bg-muted border border-border rounded px-1"
          >
            <option value="shadows">Shadows</option>
            <option value="midtones">Midtones</option>
            <option value="highlights">Highlights</option>
          </select>
        </label>
      )}

      {/* Exposure (dodge/burn only) */}
      {isDodgeBurn && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Exposure
          <input
            type="range"
            min={1}
            max={100}
            value={dodgeBurnExposure}
            onChange={(e) =>
              useEditorStore.setState({
                dodgeBurnExposure: Number(e.target.value),
              })
            }
            className="w-16 h-1 accent-primary"
          />
          <input
            type="number"
            min={1}
            max={100}
            value={dodgeBurnExposure}
            onChange={(e) =>
              useEditorStore.setState({
                dodgeBurnExposure: Number(e.target.value),
              })
            }
            className="w-12 h-6 text-xs text-center bg-muted border border-border rounded px-1"
          />
          <span className="text-[10px]">%</span>
        </label>
      )}

      {/* Sponge mode */}
      {activeTool === "sponge" && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Mode
          <select
            value={spongeMode}
            onChange={(e) =>
              useEditorStore.setState({
                spongeMode: e.target.value as "saturate" | "desaturate",
              })
            }
            className="h-6 text-xs bg-muted border border-border rounded px-1"
          >
            <option value="saturate">Saturate</option>
            <option value="desaturate">Desaturate</option>
          </select>
        </label>
      )}

      {/* Flow (sponge only) */}
      {activeTool === "sponge" && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Flow
          <input
            type="range"
            min={1}
            max={100}
            value={spongeFlow}
            onChange={(e) =>
              useEditorStore.setState({
                spongeFlow: Number(e.target.value),
              })
            }
            className="w-16 h-1 accent-primary"
          />
          <input
            type="number"
            min={1}
            max={100}
            value={spongeFlow}
            onChange={(e) =>
              useEditorStore.setState({
                spongeFlow: Number(e.target.value),
              })
            }
            className="w-12 h-6 text-xs text-center bg-muted border border-border rounded px-1"
          />
          <span className="text-[10px]">%</span>
        </label>
      )}
    </div>
  );
}
