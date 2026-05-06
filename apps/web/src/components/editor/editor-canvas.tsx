// apps/web/src/components/editor/editor-canvas.tsx

import type Konva from "konva";
import React, { useCallback, useEffect, useRef } from "react";
import { Layer, Shape, Stage } from "react-konva";
import { useCanvasZoom } from "@/hooks/use-canvas-zoom";
import { useEditorStore } from "@/stores/editor-store";
import { BrushCursorOverlay, useEditorCursor } from "./common/custom-cursor";

const CHECKERBOARD_SIZE = 20;
const CHECKERBOARD_CSS = `
  repeating-conic-gradient(
    rgba(128, 128, 128, 0.15) 0% 25%,
    transparent 0% 50%
  )
`;

export function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { stageRef, handleWheel, fitToScreen } = useCanvasZoom();

  const zoom = useEditorStore((s) => s.zoom);
  const panOffset = useEditorStore((s) => s.panOffset);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const sourceImageUrl = useEditorStore((s) => s.sourceImageUrl);
  const setCursorPosition = useEditorStore((s) => s.setCursorPosition);
  const gridVisible = useEditorStore((s) => s.gridVisible);

  const cursor = useEditorCursor();

  const [stageWidth, setStageWidth] = React.useState(800);
  const [stageHeight, setStageHeight] = React.useState(600);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setStageWidth(width);
      setStageHeight(height);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (sourceImageUrl && stageWidth > 0 && stageHeight > 0) {
      fitToScreen(stageWidth, stageHeight, canvasSize.width, canvasSize.height);
    }
  }, [sourceImageUrl, stageWidth, stageHeight, canvasSize.width, canvasSize.height, fitToScreen]);

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const x = Math.round((pointer.x - panOffset.x) / zoom);
      const y = Math.round((pointer.y - panOffset.y) / zoom);
      setCursorPosition({ x, y });
    },
    [zoom, panOffset, setCursorPosition],
  );

  const checkerboardSize = CHECKERBOARD_SIZE * zoom;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      style={{
        cursor,
        background: sourceImageUrl ? CHECKERBOARD_CSS : undefined,
        backgroundSize: sourceImageUrl ? `${checkerboardSize}px ${checkerboardSize}px` : undefined,
      }}
      data-testid="editor-canvas"
    >
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={zoom}
        scaleY={zoom}
        x={panOffset.x}
        y={panOffset.y}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
      >
        <Layer>{/* Canvas objects are rendered here by tool components */}</Layer>
        {/* Grid overlay layer (Feature 49) - non-interactive */}
        {(gridVisible || zoom >= 8) && (
          <Layer listening={false}>
            <GridOverlay
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              zoom={zoom}
              showGrid={gridVisible}
              showPixelGrid={zoom >= 8}
            />
          </Layer>
        )}
      </Stage>
      <BrushCursorOverlay containerRef={containerRef} />
    </div>
  );
}

function GridOverlay({
  canvasWidth,
  canvasHeight,
  zoom,
  showGrid,
  showPixelGrid,
}: {
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  showGrid: boolean;
  showPixelGrid: boolean;
}) {
  return (
    <Shape
      sceneFunc={(ctx, shape) => {
        ctx.beginPath();

        if (showGrid) {
          const spacing = 50;
          ctx.strokeStyle = "rgba(128, 128, 128, 0.15)";
          ctx.lineWidth = 1 / zoom;
          for (let x = spacing; x < canvasWidth; x += spacing) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
          }
          for (let y = spacing; y < canvasHeight; y += spacing) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
          }
          ctx.stroke();
        }

        if (showPixelGrid) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(128, 128, 128, 0.1)";
          ctx.lineWidth = 1 / zoom;
          for (let x = 1; x < canvasWidth; x++) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
          }
          for (let y = 1; y < canvasHeight; y++) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
          }
          ctx.stroke();
        }

        ctx.fillStrokeShape(shape);
      }}
    />
  );
}
