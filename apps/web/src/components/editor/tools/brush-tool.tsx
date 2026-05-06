// apps/web/src/components/editor/tools/brush-tool.tsx

import type Konva from "konva";
import { useCallback, useRef } from "react";
import { generateId } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import type { CanvasObject, LineAttrs } from "@/types/editor";

interface StrokeState {
  points: number[];
  objectId: string;
}

export function useBrushTool() {
  const strokeRef = useRef<StrokeState | null>(null);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const { activeTool, foregroundColor, brushSize, brushOpacity, brushHardness, zoom, panOffset } =
      useEditorStore.getState();

    if (activeTool !== "brush" && activeTool !== "pencil") return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - panOffset.x) / zoom;
    const y = (pointer.y - panOffset.y) / zoom;

    const id = generateId();
    const shadowBlurValue = activeTool === "pencil" ? 0 : brushSize * 0.4 * (1 - brushHardness);

    const attrs: LineAttrs = {
      points: [x, y],
      stroke: foregroundColor,
      strokeWidth: brushSize,
      tension: activeTool === "pencil" ? 0 : 0.5,
      lineCap: "round",
      lineJoin: "round",
      opacity: brushOpacity,
      globalCompositeOperation: "source-over",
      ...(shadowBlurValue > 0 && {
        shadowBlur: shadowBlurValue,
        shadowColor: foregroundColor,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
      }),
    };

    const obj: CanvasObject = {
      id,
      type: "line",
      layerId: useEditorStore.getState().activeLayerId,
      attrs,
    };

    useEditorStore.getState().addObject(obj);
    strokeRef.current = { points: [x, y], objectId: id };
  }, []);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!strokeRef.current) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const { zoom, panOffset } = useEditorStore.getState();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - panOffset.x) / zoom;
    const y = (pointer.y - panOffset.y) / zoom;

    strokeRef.current.points = [...strokeRef.current.points, x, y];

    useEditorStore.getState().updateObject(strokeRef.current.objectId, {
      points: [...strokeRef.current.points],
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    strokeRef.current = null;
  }, []);

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
