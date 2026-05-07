// apps/web/src/components/editor/editor-canvas.tsx

import type Konva from "konva";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Arrow,
  Ellipse,
  Group,
  Layer,
  Line,
  Rect,
  RegularPolygon,
  Shape,
  Stage,
  Star,
  Text,
} from "react-konva";
import { useCanvasZoom } from "@/hooks/use-canvas-zoom";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import { useEditorStore } from "@/stores/editor-store";
import type { CanvasObject } from "@/types/editor";
import { BrushCursorOverlay, useEditorCursor } from "./common/custom-cursor";
import { LoadingOverlay } from "./common/loading-overlay";
import { useBrushTool } from "./tools/brush-tool";
import { useEraserTool } from "./tools/eraser-tool";
import { useFillTool } from "./tools/fill-tool";
import { useGradientTool } from "./tools/gradient-tool";
import { MoveToolTransformer, useMoveTool } from "./tools/move-tool";
import { useShapeTool } from "./tools/shape-tool";

const CHECKERBOARD_SIZE = 20;
const CHECKERBOARD_CSS = `
  repeating-conic-gradient(
    rgba(128, 128, 128, 0.15) 0% 25%,
    transparent 0% 50%
  )
`;

// ---------------------------------------------------------------------------
// Canvas Object Renderer
// ---------------------------------------------------------------------------

function CanvasObjectRenderer({ obj }: { obj: CanvasObject }) {
  switch (obj.type) {
    case "line": {
      const a = obj.attrs;
      return (
        <Line
          id={obj.id}
          points={a.points}
          stroke={a.stroke}
          strokeWidth={a.strokeWidth}
          tension={a.tension}
          lineCap={a.lineCap}
          lineJoin={a.lineJoin}
          opacity={a.opacity}
          globalCompositeOperation={
            a.globalCompositeOperation as "source-over" | "destination-out" | undefined
          }
          shadowBlur={a.shadowBlur}
          shadowColor={a.shadowColor}
          shadowOffsetX={a.shadowOffsetX}
          shadowOffsetY={a.shadowOffsetY}
        />
      );
    }
    case "rect": {
      const a = obj.attrs;
      return (
        <Rect
          id={obj.id}
          x={a.x}
          y={a.y}
          width={a.width}
          height={a.height}
          fill={a.fill}
          stroke={a.stroke}
          strokeWidth={a.strokeWidth}
          cornerRadius={a.cornerRadius}
          rotation={a.rotation}
          opacity={a.opacity}
          draggable
        />
      );
    }
    case "ellipse": {
      const a = obj.attrs;
      return (
        <Ellipse
          id={obj.id}
          x={a.x}
          y={a.y}
          radiusX={a.radiusX}
          radiusY={a.radiusY}
          fill={a.fill}
          stroke={a.stroke}
          strokeWidth={a.strokeWidth}
          rotation={a.rotation}
          opacity={a.opacity}
          draggable
        />
      );
    }
    case "text": {
      const a = obj.attrs;
      return (
        <Text
          id={obj.id}
          x={a.x}
          y={a.y}
          text={a.text}
          fontFamily={a.fontFamily}
          fontSize={a.fontSize}
          fontStyle={a.fontStyle}
          textDecoration={a.textDecoration}
          align={a.align}
          fill={a.fill}
          lineHeight={a.lineHeight}
          letterSpacing={a.letterSpacing}
          width={a.width}
          height={a.height}
          rotation={a.rotation}
          opacity={a.opacity}
          draggable
        />
      );
    }
    case "arrow": {
      const a = obj.attrs;
      return (
        <Arrow
          id={obj.id}
          points={a.points}
          fill={a.fill}
          stroke={a.stroke}
          strokeWidth={a.strokeWidth}
          pointerLength={a.pointerLength}
          pointerWidth={a.pointerWidth}
          rotation={a.rotation}
          opacity={a.opacity}
          draggable
        />
      );
    }
    case "polygon": {
      const a = obj.attrs;
      return (
        <RegularPolygon
          id={obj.id}
          x={a.x}
          y={a.y}
          sides={a.sides}
          radius={a.radius}
          fill={a.fill}
          stroke={a.stroke}
          strokeWidth={a.strokeWidth}
          rotation={a.rotation}
          opacity={a.opacity}
          draggable
        />
      );
    }
    case "star": {
      const a = obj.attrs;
      return (
        <Star
          id={obj.id}
          x={a.x}
          y={a.y}
          numPoints={a.numPoints}
          innerRadius={a.innerRadius}
          outerRadius={a.outerRadius}
          fill={a.fill}
          stroke={a.stroke}
          strokeWidth={a.strokeWidth}
          rotation={a.rotation}
          opacity={a.opacity}
          draggable
        />
      );
    }
    case "image":
      // Skip image objects for now (complex: requires Konva.Image with useImage)
      return null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Tool handler dispatcher
// ---------------------------------------------------------------------------

function useActiveToolHandlers(stageRef: React.RefObject<Konva.Stage | null>) {
  const activeTool = useEditorStore((s) => s.activeTool);

  const brushTool = useBrushTool();
  const eraserTool = useEraserTool();
  const shapeTool = useShapeTool();
  const fillTool = useFillTool(stageRef);
  const gradientTool = useGradientTool();
  const moveTool = useMoveTool();

  const handlers = useMemo(() => {
    const toolMap: Record<
      string,
      {
        handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
        handleMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
        handleMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
      }
    > = {
      brush: brushTool,
      pencil: brushTool,
      eraser: eraserTool,
      "shape-rect": shapeTool,
      "shape-ellipse": shapeTool,
      "shape-line": shapeTool,
      "shape-arrow": shapeTool,
      "shape-polygon": shapeTool,
      "shape-star": shapeTool,
      fill: fillTool,
      gradient: gradientTool,
    };

    return toolMap[activeTool] ?? null;
  }, [activeTool, brushTool, eraserTool, shapeTool, fillTool, gradientTool]);

  return { handlers, moveTool };
}

// ---------------------------------------------------------------------------
// Main Canvas Component
// ---------------------------------------------------------------------------

export function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { stageRef, handleWheel, fitToScreen } = useCanvasZoom();

  const zoom = useEditorStore((s) => s.zoom);
  const panOffset = useEditorStore((s) => s.panOffset);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const sourceImageUrl = useEditorStore((s) => s.sourceImageUrl);
  const setCursorPosition = useEditorStore((s) => s.setCursorPosition);
  const gridVisible = useEditorStore((s) => s.gridVisible);
  const objects = useEditorStore((s) => s.objects);
  const layers = useEditorStore((s) => s.layers);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const activeTool = useEditorStore((s) => s.activeTool);

  const cursor = useEditorCursor();
  useEditorShortcuts();

  const { handlers, moveTool } = useActiveToolHandlers(stageRef);

  const [stageWidth, setStageWidth] = useState(800);
  const [stageHeight, setStageHeight] = useState(600);

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

  // Group objects by layer
  const objectsByLayer = useMemo(() => {
    const grouped = new Map<string, CanvasObject[]>();
    for (const layer of layers) {
      grouped.set(layer.id, []);
    }
    for (const obj of objects) {
      const existing = grouped.get(obj.layerId);
      if (existing) {
        existing.push(obj);
      }
    }
    return grouped;
  }, [objects, layers]);

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const x = Math.round((pointer.x - panOffset.x) / zoom);
      const y = Math.round((pointer.y - panOffset.y) / zoom);
      setCursorPosition({ x, y });

      // Forward to active tool
      if (handlers) {
        handlers.handleMouseMove(e);
      }
    },
    [zoom, panOffset, setCursorPosition, handlers],
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // For move tool, handle stage click to deselect
      if (activeTool === "move") {
        moveTool.onStageClick(e);
      }

      if (handlers) {
        handlers.handleMouseDown(e);
      }
    },
    [handlers, activeTool, moveTool],
  );

  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (handlers) {
        handlers.handleMouseUp(e);
      }
    },
    [handlers],
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
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Render objects grouped by layer */}
        <Layer>
          {layers.map((layer) => {
            const layerObjects = objectsByLayer.get(layer.id) ?? [];
            if (!layer.visible) return null;
            return (
              <Group key={layer.id} opacity={layer.opacity} listening={layer.id === activeLayerId}>
                {layerObjects.map((obj) => (
                  <CanvasObjectRenderer key={obj.id} obj={obj} />
                ))}
              </Group>
            );
          })}

          {/* Move tool transformer */}
          {activeTool === "move" && (
            <MoveToolTransformer transformerRef={moveTool.transformerRef} />
          )}
        </Layer>

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
      <LoadingOverlay />
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
