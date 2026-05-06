// apps/web/src/components/editor/tools/shape-tool.tsx

import type Konva from "konva";
import { useCallback, useRef } from "react";
import { generateId } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import type { CanvasObject, ToolType } from "@/types/editor";

interface DragState {
  startX: number;
  startY: number;
  objectId: string;
  toolType: ToolType;
}

const SHAPE_TOOLS = new Set<ToolType>([
  "shape-rect",
  "shape-ellipse",
  "shape-line",
  "shape-arrow",
  "shape-polygon",
  "shape-star",
]);

function constrainToDimension(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  shiftHeld: boolean,
): { w: number; h: number } {
  let w = currentX - startX;
  let h = currentY - startY;
  if (shiftHeld) {
    const size = Math.max(Math.abs(w), Math.abs(h));
    w = size * Math.sign(w || 1);
    h = size * Math.sign(h || 1);
  }
  return { w, h };
}

export function useShapeTool() {
  const dragRef = useRef<DragState | null>(null);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const {
      activeTool,
      shapeFill,
      shapeStroke,
      shapeStrokeWidth,
      shapeCornerRadius,
      shapePolygonSides,
      shapeStarPoints,
      activeLayerId,
      zoom,
      panOffset,
    } = useEditorStore.getState();

    if (!SHAPE_TOOLS.has(activeTool)) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - panOffset.x) / zoom;
    const y = (pointer.y - panOffset.y) / zoom;

    const id = generateId();
    let obj: CanvasObject;

    switch (activeTool) {
      case "shape-rect":
        obj = {
          id,
          type: "rect",
          layerId: activeLayerId,
          attrs: {
            x,
            y,
            width: 0,
            height: 0,
            fill: shapeFill,
            stroke: shapeStroke,
            strokeWidth: shapeStrokeWidth,
            cornerRadius: shapeCornerRadius,
            rotation: 0,
            opacity: 1,
          },
        };
        break;
      case "shape-ellipse":
        obj = {
          id,
          type: "ellipse",
          layerId: activeLayerId,
          attrs: {
            x,
            y,
            radiusX: 0,
            radiusY: 0,
            fill: shapeFill,
            stroke: shapeStroke,
            strokeWidth: shapeStrokeWidth,
            rotation: 0,
            opacity: 1,
          },
        };
        break;
      case "shape-line":
        obj = {
          id,
          type: "line",
          layerId: activeLayerId,
          attrs: {
            points: [x, y, x, y],
            stroke: shapeStroke,
            strokeWidth: shapeStrokeWidth,
            tension: 0,
            lineCap: "round",
            lineJoin: "round",
            opacity: 1,
            globalCompositeOperation: "source-over",
          },
        };
        break;
      case "shape-arrow":
        obj = {
          id,
          type: "arrow",
          layerId: activeLayerId,
          attrs: {
            points: [x, y, x, y],
            fill: shapeFill,
            stroke: shapeStroke,
            strokeWidth: shapeStrokeWidth,
            pointerLength: 15,
            pointerWidth: 12,
            rotation: 0,
            opacity: 1,
          },
        };
        break;
      case "shape-polygon":
        obj = {
          id,
          type: "polygon",
          layerId: activeLayerId,
          attrs: {
            x,
            y,
            sides: shapePolygonSides,
            radius: 0,
            fill: shapeFill,
            stroke: shapeStroke,
            strokeWidth: shapeStrokeWidth,
            rotation: 0,
            opacity: 1,
          },
        };
        break;
      case "shape-star":
        obj = {
          id,
          type: "star",
          layerId: activeLayerId,
          attrs: {
            x,
            y,
            numPoints: shapeStarPoints,
            innerRadius: 0,
            outerRadius: 0,
            fill: shapeFill,
            stroke: shapeStroke,
            strokeWidth: shapeStrokeWidth,
            rotation: 0,
            opacity: 1,
          },
        };
        break;
      default:
        return;
    }

    useEditorStore.getState().addObject(obj);
    dragRef.current = { startX: x, startY: y, objectId: id, toolType: activeTool };
  }, []);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!dragRef.current) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const { zoom, panOffset } = useEditorStore.getState();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - panOffset.x) / zoom;
    const y = (pointer.y - panOffset.y) / zoom;
    const { startX, startY, objectId, toolType } = dragRef.current;
    const shiftHeld = e.evt.shiftKey;

    switch (toolType) {
      case "shape-rect": {
        const { w, h } = constrainToDimension(startX, startY, x, y, shiftHeld);
        const rx = w < 0 ? startX + w : startX;
        const ry = h < 0 ? startY + h : startY;
        useEditorStore.getState().updateObject(objectId, {
          x: rx,
          y: ry,
          width: Math.abs(w),
          height: Math.abs(h),
        });
        break;
      }
      case "shape-ellipse": {
        const { w, h } = constrainToDimension(startX, startY, x, y, shiftHeld);
        useEditorStore.getState().updateObject(objectId, {
          x: startX + w / 2,
          y: startY + h / 2,
          radiusX: Math.abs(w) / 2,
          radiusY: Math.abs(h) / 2,
        });
        break;
      }
      case "shape-line": {
        let endX = x;
        let endY = y;
        if (shiftHeld) {
          const dx = x - startX;
          const dy = y - startY;
          const angle = Math.atan2(dy, dx);
          const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
          const dist = Math.sqrt(dx * dx + dy * dy);
          endX = startX + Math.cos(snapped) * dist;
          endY = startY + Math.sin(snapped) * dist;
        }
        useEditorStore.getState().updateObject(objectId, {
          points: [startX, startY, endX, endY],
        });
        break;
      }
      case "shape-arrow": {
        let endX = x;
        let endY = y;
        if (shiftHeld) {
          const dx = x - startX;
          const dy = y - startY;
          const angle = Math.atan2(dy, dx);
          const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
          const dist = Math.sqrt(dx * dx + dy * dy);
          endX = startX + Math.cos(snapped) * dist;
          endY = startY + Math.sin(snapped) * dist;
        }
        useEditorStore.getState().updateObject(objectId, {
          points: [startX, startY, endX, endY],
        });
        break;
      }
      case "shape-polygon": {
        const dx = x - startX;
        const dy = y - startY;
        const radius = Math.sqrt(dx * dx + dy * dy);
        useEditorStore.getState().updateObject(objectId, { radius });
        break;
      }
      case "shape-star": {
        const dx = x - startX;
        const dy = y - startY;
        const outerRadius = Math.sqrt(dx * dx + dy * dy);
        useEditorStore.getState().updateObject(objectId, {
          outerRadius,
          innerRadius: outerRadius * 0.4,
        });
        break;
      }
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!dragRef.current) return;

    const { objectId } = dragRef.current;
    const objects = useEditorStore.getState().objects;
    const obj = objects.find((o) => o.id === objectId);

    if (obj) {
      // Remove zero-size shapes
      const attrs = obj.attrs;
      let isDegenerate = false;
      if ("width" in attrs && "height" in attrs) {
        isDegenerate =
          (attrs as { width: number }).width < 1 && (attrs as { height: number }).height < 1;
      } else if ("radius" in attrs) {
        isDegenerate = (attrs as { radius: number }).radius < 1;
      } else if ("outerRadius" in attrs) {
        isDegenerate = (attrs as { outerRadius: number }).outerRadius < 1;
      }

      if (isDegenerate) {
        useEditorStore.getState().removeObjects([objectId]);
      } else {
        useEditorStore.getState().setSelectedObjects([objectId]);
      }
    }

    dragRef.current = null;
  }, []);

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
