// apps/web/src/components/editor/tools/eraser-tool.tsx

import type Konva from "konva";
import { useCallback, useRef } from "react";
import { generateId } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import type { CanvasObject, LineAttrs } from "@/types/editor";

interface StrokeState {
  points: number[];
  objectId: string;
}

export function useEraserTool() {
  const strokeRef = useRef<StrokeState | null>(null);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const { activeTool, brushSize, brushOpacity, brushHardness, zoom, panOffset } =
      useEditorStore.getState();

    if (activeTool !== "eraser") return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - panOffset.x) / zoom;
    const y = (pointer.y - panOffset.y) / zoom;

    const id = generateId();
    const shadowBlurValue = brushSize * 0.4 * (1 - brushHardness);

    const attrs: LineAttrs = {
      points: [x, y],
      stroke: "#000000",
      strokeWidth: brushSize,
      tension: 0.5,
      lineCap: "round",
      lineJoin: "round",
      opacity: brushOpacity,
      globalCompositeOperation: "destination-out",
      ...(shadowBlurValue > 0 && {
        shadowBlur: shadowBlurValue,
        shadowColor: "#000000",
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
    if (strokeRef.current) {
      useEditorStore.setState({
        lastAction: "Eraser Stroke",
        _historyVersion: useEditorStore.getState()._historyVersion + 1,
      });
    }
    strokeRef.current = null;
  }, []);

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
