// apps/web/src/components/editor/options/gradient-options.tsx

import { useEditorStore } from "@/stores/editor-store";

export function GradientOptions() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const gradientType = useEditorStore((s) => s.gradientType);
  const gradientOpacity = useEditorStore((s) => s.gradientOpacity);
  const gradientReverse = useEditorStore((s) => s.gradientReverse);
  const setGradientType = useEditorStore((s) => s.setGradientType);
  const setGradientOpacity = useEditorStore((s) => s.setGradientOpacity);
  const setGradientReverse = useEditorStore((s) => s.setGradientReverse);

  if (activeTool !== "gradient") return null;

  const opacityPercent = Math.round(gradientOpacity * 100);

  return (
    <div className="flex items-center gap-3">
      {/* Type toggle */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Type
        <select
          value={gradientType}
          onChange={(e) => setGradientType(e.target.value as "linear" | "radial")}
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
          value={opacityPercent}
          onChange={(e) => setGradientOpacity(Number(e.target.value) / 100)}
          className="w-20 h-1 accent-primary"
        />
        <input
          type="number"
          min={0}
          max={100}
          value={opacityPercent}
          onChange={(e) => setGradientOpacity(Number(e.target.value) / 100)}
          className="w-12 h-6 text-xs text-center bg-muted border border-border rounded px-1"
        />
        <span className="text-[10px]">%</span>
      </label>

      {/* Reverse */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={gradientReverse}
          onChange={(e) => setGradientReverse(e.target.checked)}
          className="accent-primary"
        />
        Reverse
      </label>
    </div>
  );
}
