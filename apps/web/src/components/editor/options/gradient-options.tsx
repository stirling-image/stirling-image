// apps/web/src/components/editor/options/gradient-options.tsx

import { useCallback, useState } from "react";
import { useEditorStore } from "@/stores/editor-store";
import {
  type GradientType,
  getGradientOpacity,
  getGradientReverse,
  getGradientType,
  setGradientOpacity,
  setGradientReverse,
  setGradientType,
} from "../tools/gradient-tool";

export function GradientOptions() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const [type, setLocalType] = useState<GradientType>(getGradientType);
  const [opacity, setLocalOpacity] = useState(() => Math.round(getGradientOpacity() * 100));
  const [reverse, setLocalReverse] = useState(getGradientReverse);

  const handleTypeChange = useCallback((value: GradientType) => {
    setGradientType(value);
    setLocalType(value);
  }, []);

  const handleOpacityChange = useCallback((value: number) => {
    setGradientOpacity(value / 100);
    setLocalOpacity(value);
  }, []);

  const handleReverseChange = useCallback((value: boolean) => {
    setGradientReverse(value);
    setLocalReverse(value);
  }, []);

  if (activeTool !== "gradient") return null;

  return (
    <div className="flex items-center gap-3">
      {/* Type toggle */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Type
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as GradientType)}
          className="h-6 text-xs bg-muted border border-border rounded px-1"
        >
          <option value="linear">Linear</option>
          <option value="radial">Radial</option>
        </select>
      </label>

      {/* Opacity */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Opacity
        <input
          type="range"
          min={0}
          max={100}
          value={opacity}
          onChange={(e) => handleOpacityChange(Number(e.target.value))}
          className="w-20 h-1 accent-primary"
        />
        <input
          type="number"
          min={0}
          max={100}
          value={opacity}
          onChange={(e) => handleOpacityChange(Number(e.target.value))}
          className="w-12 h-6 text-xs text-center bg-muted border border-border rounded px-1"
        />
        <span className="text-[10px]">%</span>
      </label>

      {/* Reverse */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={reverse}
          onChange={(e) => handleReverseChange(e.target.checked)}
          className="accent-primary"
        />
        Reverse
      </label>
    </div>
  );
}
