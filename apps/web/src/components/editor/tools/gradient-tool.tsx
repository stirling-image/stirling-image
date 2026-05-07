// apps/web/src/components/editor/tools/gradient-tool.tsx

import type Konva from "konva";
import { useCallback, useRef } from "react";
import { generateId } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import type { CanvasObject } from "@/types/editor";

interface DragState {
  startX: number;
  startY: number;
}

export function useGradientTool() {
  const dragRef = useRef<DragState | null>(null);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const { activeTool, zoom, panOffset } = useEditorStore.getState();

    if (activeTool !== "gradient") return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - panOffset.x) / zoom;
    const y = (pointer.y - panOffset.y) / zoom;

    dragRef.current = { startX: x, startY: y };
  }, []);

  const handleMouseMove = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    // Could show a preview line/circle here; keeping simple for now
  }, []);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!dragRef.current) return;

    const {
      foregroundColor,
      backgroundColor,
      gradientType,
      gradientOpacity,
      gradientReverse,
      canvasSize,
      zoom,
      panOffset,
    } = useEditorStore.getState();

    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const endX = (pointer.x - panOffset.x) / zoom;
    const endY = (pointer.y - panOffset.y) / zoom;
    const { startX, startY } = dragRef.current;

    const dx = endX - startX;
    const dy = endY - startY;
    if (Math.sqrt(dx * dx + dy * dy) < 2) {
      dragRef.current = null;
      return;
    }

    // Build gradient on an offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      dragRef.current = null;
      return;
    }

    const color1 = gradientReverse ? backgroundColor : foregroundColor;
    const color2 = gradientReverse ? foregroundColor : backgroundColor;

    let gradient: CanvasGradient;

    if (gradientType === "radial") {
      const radius = Math.sqrt(dx * dx + dy * dy);
      gradient = ctx.createRadialGradient(startX, startY, 0, startX, startY, radius);
    } else {
      gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    }

    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    const dataUrl = canvas.toDataURL();

    const obj: CanvasObject = {
      id: generateId(),
      type: "image",
      layerId: useEditorStore.getState().activeLayerId,
      attrs: {
        x: 0,
        y: 0,
        width: canvasSize.width,
        height: canvasSize.height,
        rotation: 0,
        opacity: gradientOpacity,
        src: dataUrl,
      },
    };

    useEditorStore.getState().addObject(obj);
    dragRef.current = null;
  }, []);

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
