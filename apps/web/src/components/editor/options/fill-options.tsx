// apps/web/src/components/editor/options/fill-options.tsx

import { useCallback, useState } from "react";
import { useEditorStore } from "@/stores/editor-store";
import {
  getFillContiguous,
  getFillTolerance,
  setFillContiguous,
  setFillTolerance,
} from "../tools/fill-tool";

export function FillOptions() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const [tolerance, setLocalTolerance] = useState(getFillTolerance);
  const [contiguous, setLocalContiguous] = useState(getFillContiguous);

  const handleToleranceChange = useCallback((value: number) => {
    setFillTolerance(value);
    setLocalTolerance(value);
  }, []);

  const handleContiguousChange = useCallback((value: boolean) => {
    setFillContiguous(value);
    setLocalContiguous(value);
  }, []);

  if (activeTool !== "fill") return null;

  return (
    <div className="flex items-center gap-3">
      {/* Tolerance */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Tolerance
        <input
          type="range"
          min={0}
          max={255}
          value={tolerance}
          onChange={(e) => handleToleranceChange(Number(e.target.value))}
          className="w-20 h-1 accent-primary"
        />
        <input
          type="number"
          min={0}
          max={255}
          value={tolerance}
          onChange={(e) => handleToleranceChange(Number(e.target.value))}
          className="w-12 h-6 text-xs text-center bg-muted border border-border rounded px-1"
        />
      </label>

      {/* Contiguous */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={contiguous}
          onChange={(e) => handleContiguousChange(e.target.checked)}
          className="accent-primary"
        />
        Contiguous
      </label>
    </div>
  );
}
