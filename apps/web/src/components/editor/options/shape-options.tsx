// apps/web/src/components/editor/options/shape-options.tsx

import { useEditorStore } from "@/stores/editor-store";
import type { ToolType } from "@/types/editor";

const SHAPE_TOOLS = new Set<ToolType>([
  "shape-rect",
  "shape-ellipse",
  "shape-line",
  "shape-arrow",
  "shape-polygon",
  "shape-star",
]);

const SHAPE_TYPE_OPTIONS: { value: ToolType; label: string }[] = [
  { value: "shape-rect", label: "Rectangle" },
  { value: "shape-ellipse", label: "Ellipse" },
  { value: "shape-line", label: "Line" },
  { value: "shape-arrow", label: "Arrow" },
  { value: "shape-polygon", label: "Polygon" },
  { value: "shape-star", label: "Star" },
];

export function ShapeOptions() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setTool = useEditorStore((s) => s.setTool);
  const shapeFill = useEditorStore((s) => s.shapeFill);
  const shapeStroke = useEditorStore((s) => s.shapeStroke);
  const shapeStrokeWidth = useEditorStore((s) => s.shapeStrokeWidth);
  const shapeCornerRadius = useEditorStore((s) => s.shapeCornerRadius);
  const shapePolygonSides = useEditorStore((s) => s.shapePolygonSides);
  const shapeStarPoints = useEditorStore((s) => s.shapeStarPoints);

  if (!SHAPE_TOOLS.has(activeTool)) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Shape type selector */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Shape
        <select
          value={activeTool}
          onChange={(e) => setTool(e.target.value as ToolType)}
          className="h-6 text-xs bg-muted border border-border rounded px-1"
        >
          {SHAPE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {/* Fill color */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Fill
        <input
          type="color"
          value={shapeFill}
          onChange={(e) => useEditorStore.setState({ shapeFill: e.target.value })}
          className="w-6 h-6 border border-border rounded cursor-pointer"
        />
      </label>

      {/* Stroke color */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Stroke
        <input
          type="color"
          value={shapeStroke}
          onChange={(e) => useEditorStore.setState({ shapeStroke: e.target.value })}
          className="w-6 h-6 border border-border rounded cursor-pointer"
        />
      </label>

      {/* Stroke width */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Width
        <input
          type="range"
          min={0}
          max={50}
          value={shapeStrokeWidth}
          onChange={(e) =>
            useEditorStore.setState({
              shapeStrokeWidth: Number(e.target.value),
            })
          }
          className="w-16 h-1 accent-primary"
        />
        <input
          type="number"
          min={0}
          max={50}
          value={shapeStrokeWidth}
          onChange={(e) =>
            useEditorStore.setState({
              shapeStrokeWidth: Number(e.target.value),
            })
          }
          className="w-10 h-6 text-xs text-center bg-muted border border-border rounded px-1"
        />
      </label>

      {/* Corner radius (only for rect) */}
      {activeTool === "shape-rect" && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Radius
          <input
            type="range"
            min={0}
            max={100}
            value={shapeCornerRadius}
            onChange={(e) =>
              useEditorStore.setState({
                shapeCornerRadius: Number(e.target.value),
              })
            }
            className="w-16 h-1 accent-primary"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={shapeCornerRadius}
            onChange={(e) =>
              useEditorStore.setState({
                shapeCornerRadius: Number(e.target.value),
              })
            }
            className="w-10 h-6 text-xs text-center bg-muted border border-border rounded px-1"
          />
        </label>
      )}

      {/* Polygon sides */}
      {activeTool === "shape-polygon" && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Sides
          <input
            type="number"
            min={3}
            max={20}
            value={shapePolygonSides}
            onChange={(e) =>
              useEditorStore.setState({
                shapePolygonSides: Number(e.target.value),
              })
            }
            className="w-12 h-6 text-xs text-center bg-muted border border-border rounded px-1"
          />
        </label>
      )}

      {/* Star points */}
      {activeTool === "shape-star" && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Points
          <input
            type="number"
            min={3}
            max={20}
            value={shapeStarPoints}
            onChange={(e) =>
              useEditorStore.setState({
                shapeStarPoints: Number(e.target.value),
              })
            }
            className="w-12 h-6 text-xs text-center bg-muted border border-border rounded px-1"
          />
        </label>
      )}
    </div>
  );
}
