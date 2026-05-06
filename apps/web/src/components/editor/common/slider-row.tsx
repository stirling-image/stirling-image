// apps/web/src/components/editor/common/slider-row.tsx

import { cn } from "@/lib/utils";

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
}: SliderRowProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs text-muted-foreground w-20 shrink-0 truncate">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 accent-primary cursor-pointer"
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!Number.isNaN(v)) {
            onChange(Math.max(min, Math.min(max, v)));
          }
        }}
        className="w-14 px-1 py-0.5 text-xs text-right bg-muted border border-border rounded text-foreground"
      />
    </div>
  );
}
