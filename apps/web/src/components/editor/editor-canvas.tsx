// apps/web/src/components/editor/editor-canvas.tsx

import type Konva from "konva";
import KonvaFilters from "konva";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Arrow,
  Ellipse,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  RegularPolygon,
  Shape,
  Stage,
  Star,
  Text,
} from "react-konva";
import useImage from "use-image";
import { useCanvasZoom } from "@/hooks/use-canvas-zoom";
import { useEditorStore } from "@/stores/editor-store";
import type { AdjustmentValues, CanvasObject, FilterConfig, ImageAttrs } from "@/types/editor";
import { ContextMenu, useContextMenu } from "./common/context-menu";
import { BrushCursorOverlay, useEditorCursor } from "./common/custom-cursor";
import { LoadingOverlay } from "./common/loading-overlay";
import { useBrushTool } from "./tools/brush-tool";
import { CropOverlay } from "./tools/crop-tool";
import { useEraserTool } from "./tools/eraser-tool";
import { useFillTool } from "./tools/fill-tool";
import { useGradientTool } from "./tools/gradient-tool";
import { MoveToolTransformer, useMoveTool } from "./tools/move-tool";
import { SelectionOverlay, useSelectionTool } from "./tools/selection-tool";
import { useShapeTool } from "./tools/shape-tool";
import { useTextTool } from "./tools/text-tool";
import { TransformToolTransformer, useTransformTool } from "./tools/transform-tool";

// Module-level stage ref for export dialog access (Issue #6)
export const editorStageRefHolder: { current: Konva.Stage | null } = {
  current: null,
};

const CHECKERBOARD_SIZE = 20;
const CHECKERBOARD_CSS = `
  repeating-conic-gradient(
    rgba(128, 128, 128, 0.15) 0% 25%,
    transparent 0% 50%
  )
`;

// ---------------------------------------------------------------------------
// Source Image Component (Issue #14)
// ---------------------------------------------------------------------------

function SourceImage({
  url,
  adjustments,
  filters,
}: {
  url: string;
  adjustments: AdjustmentValues;
  filters: FilterConfig[];
}) {
  const [image] = useImage(url);
  const imageRef = useRef<Konva.Image>(null);

  // Issue #12: Apply adjustments/filters to the source image node
  const hasActiveAdjustments = Object.values(adjustments).some((v) => v !== 0);
  const hasActiveFilters = filters.some((f) => f.enabled);

  useEffect(() => {
    const node = imageRef.current;
    if (!node || !image) return;

    if (hasActiveAdjustments || hasActiveFilters) {
      const konvaFilters: Array<((this: Konva.Node, imageData: ImageData) => void) | string> = [];

      if (adjustments.brightness !== 0) {
        konvaFilters.push(KonvaFilters.Filters.Brighten);
        node.brightness(adjustments.brightness / 100);
      }
      if (adjustments.contrast !== 0) {
        konvaFilters.push(KonvaFilters.Filters.Contrast);
        node.contrast(adjustments.contrast);
      }
      if (adjustments.hue !== 0 || adjustments.saturation !== 0 || adjustments.luminance !== 0) {
        konvaFilters.push(KonvaFilters.Filters.HSL);
        node.hue(adjustments.hue);
        node.saturation(adjustments.saturation / 100);
        node.luminance(adjustments.luminance / 100);
      }

      // Apply enabled filters
      for (const f of filters) {
        if (!f.enabled) continue;
        switch (f.type) {
          case "blur":
            konvaFilters.push(KonvaFilters.Filters.Blur);
            node.blurRadius(f.params.radius ?? 0);
            break;
          case "grayscale":
            konvaFilters.push(KonvaFilters.Filters.Grayscale);
            break;
          case "sepia":
            konvaFilters.push(KonvaFilters.Filters.Sepia);
            break;
          case "invert":
            konvaFilters.push(KonvaFilters.Filters.Invert);
            break;
          case "pixelate":
            konvaFilters.push(KonvaFilters.Filters.Pixelate);
            node.pixelSize(f.params.size ?? 1);
            break;
          case "emboss":
            konvaFilters.push(KonvaFilters.Filters.Emboss);
            node.embossStrength(f.params.strength ?? 0);
            node.embossWhiteLevel(0.5);
            node.embossBlend(true);
            break;
          case "posterize":
            konvaFilters.push(KonvaFilters.Filters.Posterize);
            node.levels(f.params.levels ?? 8);
            break;
          case "noise":
            konvaFilters.push(KonvaFilters.Filters.Noise);
            node.noise(f.params.amount ?? 0);
            break;
          case "solarize":
            konvaFilters.push(KonvaFilters.Filters.Solarize);
            break;
          case "threshold":
            konvaFilters.push(KonvaFilters.Filters.Threshold);
            node.threshold((f.params.level ?? 0.5) * 255);
            break;
          case "kaleidoscope":
            konvaFilters.push(KonvaFilters.Filters.Kaleidoscope);
            node.kaleidoscopePower(f.params.power ?? 2);
            node.kaleidoscopeAngle(f.params.angle ?? 0);
            break;
        }
      }

      node.clearCache();
      node.cache();
      node.filters(konvaFilters);
      node.getLayer()?.batchDraw();
    } else {
      node.clearCache();
      node.filters([]);
      node.getLayer()?.batchDraw();
    }
  }, [image, adjustments, filters, hasActiveAdjustments, hasActiveFilters]);

  if (!image) return null;

  return <KonvaImage ref={imageRef} image={image} x={0} y={0} listening={false} />;
}

// ---------------------------------------------------------------------------
// Image Object Component (Issue #4)
// ---------------------------------------------------------------------------

function ImageObject({
  obj,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
  draggable,
}: {
  obj: CanvasObject & { type: "image" };
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  draggable: boolean;
}) {
  const a = obj.attrs as ImageAttrs;
  const [image] = useImage(a.src);
  if (!image) return null;

  return (
    <KonvaImage
      id={obj.id}
      image={image}
      x={a.x}
      y={a.y}
      width={a.width}
      height={a.height}
      rotation={a.rotation}
      opacity={a.opacity}
      draggable={draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
}

// ---------------------------------------------------------------------------
// Canvas Object Renderer (Issue #3: wire move tool handlers)
// ---------------------------------------------------------------------------

function CanvasObjectRenderer({
  obj,
  isMoveTool,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
}: {
  obj: CanvasObject;
  isMoveTool: boolean;
  onSelect?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
}) {
  const draggable = isMoveTool;

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
          draggable={draggable}
          onClick={onSelect}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
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
          draggable={draggable}
          onClick={onSelect}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
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
          draggable={draggable}
          onClick={onSelect}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
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
          draggable={draggable}
          onClick={onSelect}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
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
          draggable={draggable}
          onClick={onSelect}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
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
          draggable={draggable}
          onClick={onSelect}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
        />
      );
    }
    case "image":
      return (
        <ImageObject
          obj={obj}
          onClick={onSelect}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
          draggable={draggable}
        />
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Tool handler dispatcher
// ---------------------------------------------------------------------------

function useActiveToolHandlers(stageRef: React.RefObject<Konva.Stage | null>) {
  const activeTool = useEditorStore((s) => s.activeTool);
  const zoom = useEditorStore((s) => s.zoom);
  const panOffset = useEditorStore((s) => s.panOffset);

  const brushTool = useBrushTool();
  const eraserTool = useEraserTool();
  const shapeTool = useShapeTool();
  const textTool = useTextTool();
  const fillTool = useFillTool(stageRef);
  const gradientTool = useGradientTool();
  const moveTool = useMoveTool();
  const selectionTool = useSelectionTool();
  const transformTool = useTransformTool();

  const selectionHandlers = useMemo(
    () => ({
      handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        const pointer = stage?.getPointerPosition();
        if (!pointer) return;
        const pos = { x: (pointer.x - panOffset.x) / zoom, y: (pointer.y - panOffset.y) / zoom };
        selectionTool.onMouseDown(pos, stage ?? undefined);
      },
      handleMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => {
        const pointer = e.target.getStage()?.getPointerPosition();
        if (!pointer) return;
        const pos = { x: (pointer.x - panOffset.x) / zoom, y: (pointer.y - panOffset.y) / zoom };
        selectionTool.onMouseMove(pos);
      },
      handleMouseUp: () => {
        selectionTool.onMouseUp();
      },
    }),
    [selectionTool, zoom, panOffset],
  );

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
      text: textTool,
      fill: fillTool,
      gradient: gradientTool,
      "marquee-rect": selectionHandlers,
      "marquee-ellipse": selectionHandlers,
      "lasso-free": selectionHandlers,
      "lasso-poly": selectionHandlers,
      "magic-wand": selectionHandlers,
    };

    return toolMap[activeTool] ?? null;
  }, [
    activeTool,
    brushTool,
    eraserTool,
    shapeTool,
    textTool,
    fillTool,
    gradientTool,
    selectionHandlers,
  ]);

  return { handlers, moveTool, selectionTool, transformTool };
}

// ---------------------------------------------------------------------------
// Main Canvas Component
// ---------------------------------------------------------------------------

export function EditorCanvas({
  onCanvasResize,
  onImageResize,
}: {
  onCanvasResize?: () => void;
  onImageResize?: () => void;
} = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectionLayerRef = useRef<Konva.Layer>(null);
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
  const setPanOffset = useEditorStore((s) => s.setPanOffset);
  const adjustments = useEditorStore((s) => s.adjustments);
  const filters = useEditorStore((s) => s.filters);

  // Issue #10: Shortcuts moved to EditorPage, removed from here
  const cursor = useEditorCursor();
  const selectedObjectIds = useEditorStore((s) => s.selectedObjectIds);
  const contextMenu = useContextMenu();

  const { handlers, moveTool, selectionTool, transformTool } = useActiveToolHandlers(stageRef);

  const [stageWidth, setStageWidth] = useState(800);
  const [stageHeight, setStageHeight] = useState(600);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only sync of stable ref
  useEffect(() => {
    editorStageRefHolder.current = stageRef.current;
    return () => {
      editorStageRefHolder.current = null;
    };
  }, []);

  // Issue #5: Track raw screen cursor position for brush overlay
  const [screenCursor, setScreenCursor] = useState({ x: 0, y: 0 });

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

  const isMoveTool = activeTool === "move";

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

  // Issue #5: Track screen-space cursor for brush overlay
  const handleContainerMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setScreenCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const checkerboardSize = CHECKERBOARD_SIZE * zoom;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: canvas container tracks cursor for brush overlay
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      style={{
        cursor,
        background: sourceImageUrl ? CHECKERBOARD_CSS : undefined,
        backgroundSize: sourceImageUrl ? `${checkerboardSize}px ${checkerboardSize}px` : undefined,
        backgroundPosition: sourceImageUrl ? `${panOffset.x}px ${panOffset.y}px` : undefined,
      }}
      data-testid="editor-canvas"
      onMouseMove={handleContainerMouseMove}
      onContextMenu={(e) => contextMenu.handleContextMenu(e, selectedObjectIds.length > 0)}
    >
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={zoom}
        scaleY={zoom}
        x={panOffset.x}
        y={panOffset.y}
        draggable={activeTool === "hand"}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onDragEnd={(e) => {
          if (activeTool === "hand") {
            const stage = e.target.getStage();
            if (stage) {
              setPanOffset({ x: stage.x(), y: stage.y() });
            }
          }
        }}
      >
        {/* Render objects grouped by layer */}
        <Layer ref={selectionLayerRef}>
          {/* Issue #14: Render source image as background */}
          {sourceImageUrl && (
            <SourceImage url={sourceImageUrl} adjustments={adjustments} filters={filters} />
          )}

          {layers.map((layer) => {
            const layerObjects = objectsByLayer.get(layer.id) ?? [];
            if (!layer.visible) return null;
            return (
              <Group key={layer.id} opacity={layer.opacity} listening={layer.id === activeLayerId}>
                {layerObjects.map((obj) => (
                  <CanvasObjectRenderer
                    key={obj.id}
                    obj={obj}
                    isMoveTool={isMoveTool}
                    onSelect={isMoveTool ? moveTool.onSelect : undefined}
                    onDragStart={isMoveTool ? moveTool.onDragStart : undefined}
                    onDragMove={isMoveTool ? moveTool.onDragMove : undefined}
                    onDragEnd={isMoveTool ? moveTool.onDragEnd : undefined}
                    onTransformEnd={isMoveTool ? moveTool.onTransformEnd : undefined}
                  />
                ))}
              </Group>
            );
          })}

          {/* Move tool transformer */}
          {activeTool === "move" && (
            <MoveToolTransformer transformerRef={moveTool.transformerRef} />
          )}

          {/* Transform tool transformer */}
          {activeTool === "transform" && (
            <TransformToolTransformer transformerRef={transformTool.transformerRef} />
          )}

          {/* Selection overlay (marching ants) */}
          <SelectionOverlay layerRef={selectionLayerRef} />

          {/* Active selection preview (drawn while dragging) */}
          {selectionTool.isDrawing && selectionTool.currentPoints.length >= 4 && (
            <Rect
              x={Math.min(selectionTool.currentPoints[0], selectionTool.currentPoints[2])}
              y={Math.min(selectionTool.currentPoints[1], selectionTool.currentPoints[3])}
              width={Math.abs(selectionTool.currentPoints[2] - selectionTool.currentPoints[0])}
              height={Math.abs(selectionTool.currentPoints[3] - selectionTool.currentPoints[1])}
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          )}
        </Layer>

        {/* Crop overlay layer */}
        {activeTool === "crop" && (
          <Layer>
            <CropOverlay />
          </Layer>
        )}

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
      <BrushCursorOverlay containerRef={containerRef} screenCursor={screenCursor} />
      <LoadingOverlay />
      {contextMenu.position && (
        <ContextMenu
          position={contextMenu.position}
          menuType={contextMenu.menuType}
          onClose={contextMenu.close}
          onCanvasResize={onCanvasResize}
          onImageResize={onImageResize}
        />
      )}
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
      sceneFunc={(ctx, _shape) => {
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
      }}
    />
  );
}
