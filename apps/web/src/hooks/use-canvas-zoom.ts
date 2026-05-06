// apps/web/src/hooks/use-canvas-zoom.ts

import Konva from "konva";
import { useCallback, useRef } from "react";
import { useEditorStore } from "@/stores/editor-store";

const ZOOM_SENSITIVITY = 1.1;
const ZOOM_ANIMATION_DURATION = 0.15;

export function useCanvasZoom() {
  const stageRef = useRef<Konva.Stage>(null);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setPanOffset = useEditorStore((s) => s.setPanOffset);
  const zoom = useEditorStore((s) => s.zoom);
  const panOffset = useEditorStore((s) => s.panOffset);
  const tweenRef = useRef<Konva.Tween | null>(null);

  const animateZoom = useCallback(
    (targetZoom: number, targetPos: { x: number; y: number }) => {
      const stage = stageRef.current;
      if (!stage) {
        setZoom(targetZoom);
        setPanOffset(targetPos);
        return;
      }
      if (tweenRef.current) {
        tweenRef.current.destroy();
      }
      tweenRef.current = new Konva.Tween({
        node: stage,
        scaleX: targetZoom,
        scaleY: targetZoom,
        x: targetPos.x,
        y: targetPos.y,
        duration: ZOOM_ANIMATION_DURATION,
        easing: Konva.Easings.EaseOut,
        onFinish: () => {
          setZoom(targetZoom);
          setPanOffset(targetPos);
          tweenRef.current = null;
        },
      });
      tweenRef.current.play();
    },
    [setZoom, setPanOffset],
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const isZoom = e.evt.ctrlKey || e.evt.metaKey;

      if (isZoom) {
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const oldZoom = zoom;
        const direction = e.evt.deltaY < 0 ? 1 : -1;
        const newZoom = direction > 0 ? oldZoom * ZOOM_SENSITIVITY : oldZoom / ZOOM_SENSITIVITY;
        const clampedZoom = Math.max(0.01, Math.min(64, newZoom));

        const mousePointTo = {
          x: (pointer.x - panOffset.x) / oldZoom,
          y: (pointer.y - panOffset.y) / oldZoom,
        };

        const newPos = {
          x: pointer.x - mousePointTo.x * clampedZoom,
          y: pointer.y - mousePointTo.y * clampedZoom,
        };

        animateZoom(clampedZoom, newPos);
      } else {
        const dx = e.evt.shiftKey ? -e.evt.deltaY : -e.evt.deltaX;
        const dy = e.evt.shiftKey ? 0 : -e.evt.deltaY;
        setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
      }
    },
    [zoom, panOffset, setPanOffset, animateZoom],
  );

  const fitToScreen = useCallback(
    (viewportWidth: number, viewportHeight: number, imageWidth: number, imageHeight: number) => {
      const scaleX = viewportWidth / imageWidth;
      const scaleY = viewportHeight / imageHeight;
      const fitZoom = Math.min(scaleX, scaleY) * 0.9;
      const offsetX = (viewportWidth - imageWidth * fitZoom) / 2;
      const offsetY = (viewportHeight - imageHeight * fitZoom) / 2;
      animateZoom(fitZoom, { x: offsetX, y: offsetY });
    },
    [animateZoom],
  );

  const zoomTo = useCallback(
    (targetZoom: number, viewportWidth: number, viewportHeight: number) => {
      const canvasSize = useEditorStore.getState().canvasSize;
      const offsetX = (viewportWidth - canvasSize.width * targetZoom) / 2;
      const offsetY = (viewportHeight - canvasSize.height * targetZoom) / 2;
      animateZoom(targetZoom, { x: offsetX, y: offsetY });
    },
    [animateZoom],
  );

  return { stageRef, handleWheel, fitToScreen, zoomTo };
}
