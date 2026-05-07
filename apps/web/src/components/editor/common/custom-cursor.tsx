// apps/web/src/components/editor/common/custom-cursor.tsx
import { useEditorStore } from "@/stores/editor-store";
import type { ToolType } from "@/types/editor";

const TOOL_CURSORS: Record<ToolType, string> = {
  move: "default",
  "marquee-rect": "crosshair",
  "marquee-ellipse": "crosshair",
  "lasso-free": "crosshair",
  "lasso-poly": "crosshair",
  "magic-wand": "crosshair",
  crop: "crosshair",
  eyedropper: "crosshair",
  brush: "none",
  eraser: "none",
  pencil: "none",
  "clone-stamp": "none",
  dodge: "none",
  burn: "none",
  sponge: "none",
  "blur-brush": "none",
  "sharpen-brush": "none",
  smudge: "none",
  fill: "crosshair",
  gradient: "crosshair",
  "shape-rect": "crosshair",
  "shape-ellipse": "crosshair",
  "shape-line": "crosshair",
  "shape-arrow": "crosshair",
  "shape-polygon": "crosshair",
  "shape-star": "crosshair",
  text: "text",
  hand: "grab",
  zoom: "zoom-in",
  transform: "default",
};

const BRUSH_CURSOR_TOOLS = new Set<ToolType>([
  "brush",
  "eraser",
  "pencil",
  "clone-stamp",
  "dodge",
  "burn",
  "sponge",
  "blur-brush",
  "sharpen-brush",
  "smudge",
]);

export function useEditorCursor(): string {
  const activeTool = useEditorStore((s) => s.activeTool);
  const isSpaceHeld = useEditorStore((s) => s.isSpaceHeld);
  if (isSpaceHeld) return "grab";
  return TOOL_CURSORS[activeTool] || "default";
}

interface BrushCursorOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  screenCursor: { x: number; y: number };
}

export function BrushCursorOverlay({ screenCursor }: BrushCursorOverlayProps) {
  const activeTool = useEditorStore((s) => s.activeTool);
  const brushSize = useEditorStore((s) => s.brushSize);
  const zoom = useEditorStore((s) => s.zoom);

  if (!BRUSH_CURSOR_TOOLS.has(activeTool)) return null;

  const displaySize = brushSize * zoom;
  const isEraser = activeTool === "eraser";

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: screenCursor.x - displaySize / 2,
        top: screenCursor.y - displaySize / 2,
        width: displaySize,
        height: displaySize,
        borderRadius: "50%",
        border: isEraser ? "2px dashed currentColor" : "1.5px solid currentColor",
        opacity: 0.7,
      }}
    />
  );
}
