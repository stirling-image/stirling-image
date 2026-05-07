import type Konva from "konva";
import { useCallback, useEffect, useRef } from "react";
import { Transformer } from "react-konva";
import type { SmartGuide } from "@/components/editor/common/smart-guides";
import { useEditorStore } from "@/stores/editor-store";

// ---------------------------------------------------------------------------
// Smart guide calculation
// ---------------------------------------------------------------------------

function findSmartGuides(
  node: Konva.Node,
  allNodes: Konva.Node[],
  canvasWidth: number,
  canvasHeight: number,
  threshold: number,
): SmartGuide[] {
  const box = node.getClientRect({ relativeTo: node.getParent() ?? undefined });
  const guides: SmartGuide[] = [];

  const dragEdges = {
    left: box.x,
    right: box.x + box.width,
    centerX: box.x + box.width / 2,
    top: box.y,
    bottom: box.y + box.height,
    centerY: box.y + box.height / 2,
  };

  // Canvas edges + center
  const canvasSnaps = [
    { pos: 0, type: "canvas" as const, orient: "vertical" as const },
    {
      pos: canvasWidth / 2,
      type: "canvas" as const,
      orient: "vertical" as const,
    },
    { pos: canvasWidth, type: "canvas" as const, orient: "vertical" as const },
    { pos: 0, type: "canvas" as const, orient: "horizontal" as const },
    {
      pos: canvasHeight / 2,
      type: "canvas" as const,
      orient: "horizontal" as const,
    },
    {
      pos: canvasHeight,
      type: "canvas" as const,
      orient: "horizontal" as const,
    },
  ];

  for (const snap of canvasSnaps) {
    if (snap.orient === "vertical") {
      for (const edge of [dragEdges.left, dragEdges.centerX, dragEdges.right]) {
        if (Math.abs(edge - snap.pos) < threshold) {
          guides.push({
            orientation: "vertical",
            position: snap.pos,
            type: snap.type,
          });
        }
      }
    } else {
      for (const edge of [dragEdges.top, dragEdges.centerY, dragEdges.bottom]) {
        if (Math.abs(edge - snap.pos) < threshold) {
          guides.push({
            orientation: "horizontal",
            position: snap.pos,
            type: snap.type,
          });
        }
      }
    }
  }

  // Other objects
  for (const other of allNodes) {
    if (other === node) continue;
    const ob = other.getClientRect({
      relativeTo: other.getParent() ?? undefined,
    });
    const targetEdges = {
      left: ob.x,
      right: ob.x + ob.width,
      centerX: ob.x + ob.width / 2,
      top: ob.y,
      bottom: ob.y + ob.height,
      centerY: ob.y + ob.height / 2,
    };

    for (const edgeVal of [targetEdges.left, targetEdges.centerX, targetEdges.right]) {
      for (const dragVal of [dragEdges.left, dragEdges.centerX, dragEdges.right]) {
        if (Math.abs(dragVal - edgeVal) < threshold) {
          guides.push({
            orientation: "vertical",
            position: edgeVal,
            type: dragVal === dragEdges.centerX ? "center" : "edge",
          });
        }
      }
    }

    for (const edgeVal of [targetEdges.top, targetEdges.centerY, targetEdges.bottom]) {
      for (const dragVal of [dragEdges.top, dragEdges.centerY, dragEdges.bottom]) {
        if (Math.abs(dragVal - edgeVal) < threshold) {
          guides.push({
            orientation: "horizontal",
            position: edgeVal,
            type: dragVal === dragEdges.centerY ? "center" : "edge",
          });
        }
      }
    }
  }

  return guides;
}

function snapPosition(
  pos: { x: number; y: number },
  guides: SmartGuide[],
  box: { width: number; height: number },
  threshold: number,
): { x: number; y: number } {
  let { x, y } = pos;

  for (const g of guides) {
    if (g.orientation === "vertical") {
      if (Math.abs(x - g.position) < threshold) x = g.position;
      else if (Math.abs(x + box.width / 2 - g.position) < threshold) x = g.position - box.width / 2;
      else if (Math.abs(x + box.width - g.position) < threshold) x = g.position - box.width;
    } else {
      if (Math.abs(y - g.position) < threshold) y = g.position;
      else if (Math.abs(y + box.height / 2 - g.position) < threshold)
        y = g.position - box.height / 2;
      else if (Math.abs(y + box.height - g.position) < threshold) y = g.position - box.height;
    }
  }

  return { x, y };
}

// ---------------------------------------------------------------------------
// Exported helpers for alignment
// ---------------------------------------------------------------------------

export function alignObjects(
  direction:
    | "left"
    | "center-h"
    | "right"
    | "top"
    | "center-v"
    | "bottom"
    | "distribute-h"
    | "distribute-v",
  objectIds: string[],
  objects: { id: string; attrs: Record<string, unknown> }[],
  updateObject: (id: string, attrs: Record<string, unknown>) => void,
  canvasSize?: { width: number; height: number },
): void {
  const selected = objects.filter((o) => objectIds.includes(o.id));
  if (selected.length === 0) return;
  if (selected.length < 3 && direction.startsWith("distribute")) return;

  const bounds = selected.map((o) => ({
    id: o.id,
    x: (o.attrs.x as number) ?? 0,
    y: (o.attrs.y as number) ?? 0,
    w: (o.attrs.width as number) ?? 0,
    h: (o.attrs.height as number) ?? 0,
  }));

  // Single object: align relative to canvas bounds
  if (selected.length === 1 && canvasSize) {
    const b = bounds[0];
    switch (direction) {
      case "left":
        updateObject(b.id, { x: 0 });
        break;
      case "center-h":
        updateObject(b.id, { x: canvasSize.width / 2 - b.w / 2 });
        break;
      case "right":
        updateObject(b.id, { x: canvasSize.width - b.w });
        break;
      case "top":
        updateObject(b.id, { y: 0 });
        break;
      case "center-v":
        updateObject(b.id, { y: canvasSize.height / 2 - b.h / 2 });
        break;
      case "bottom":
        updateObject(b.id, { y: canvasSize.height - b.h });
        break;
    }
    return;
  }

  if (selected.length < 2) return;

  switch (direction) {
    case "left": {
      const minX = Math.min(...bounds.map((b) => b.x));
      for (const b of bounds) updateObject(b.id, { x: minX });
      break;
    }
    case "center-h": {
      const minX = Math.min(...bounds.map((b) => b.x));
      const maxX = Math.max(...bounds.map((b) => b.x + b.w));
      const center = (minX + maxX) / 2;
      for (const b of bounds) updateObject(b.id, { x: center - b.w / 2 });
      break;
    }
    case "right": {
      const maxX = Math.max(...bounds.map((b) => b.x + b.w));
      for (const b of bounds) updateObject(b.id, { x: maxX - b.w });
      break;
    }
    case "top": {
      const minY = Math.min(...bounds.map((b) => b.y));
      for (const b of bounds) updateObject(b.id, { y: minY });
      break;
    }
    case "center-v": {
      const minY = Math.min(...bounds.map((b) => b.y));
      const maxY = Math.max(...bounds.map((b) => b.y + b.h));
      const center = (minY + maxY) / 2;
      for (const b of bounds) updateObject(b.id, { y: center - b.h / 2 });
      break;
    }
    case "bottom": {
      const maxY = Math.max(...bounds.map((b) => b.y + b.h));
      for (const b of bounds) updateObject(b.id, { y: maxY - b.h });
      break;
    }
    case "distribute-h": {
      const sorted = [...bounds].sort((a, b) => a.x - b.x);
      const totalW = sorted.reduce((s, b) => s + b.w, 0);
      const minX = sorted[0].x;
      const maxX = sorted[sorted.length - 1].x + sorted[sorted.length - 1].w;
      const gap = (maxX - minX - totalW) / (sorted.length - 1);
      let cx = minX;
      for (const b of sorted) {
        updateObject(b.id, { x: cx });
        cx += b.w + gap;
      }
      break;
    }
    case "distribute-v": {
      const sorted = [...bounds].sort((a, b) => a.y - b.y);
      const totalH = sorted.reduce((s, b) => s + b.h, 0);
      const minY = sorted[0].y;
      const maxY = sorted[sorted.length - 1].y + sorted[sorted.length - 1].h;
      const gap = (maxY - minY - totalH) / (sorted.length - 1);
      let cy = minY;
      for (const b of sorted) {
        updateObject(b.id, { y: cy });
        cy += b.h + gap;
      }
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Hook: useMoveTool
// ---------------------------------------------------------------------------

export interface MoveToolApi {
  transformerRef: React.RefObject<Konva.Transformer | null>;
  smartGuides: SmartGuide[];
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onStageClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
  nudge: (dx: number, dy: number) => void;
}

export function useMoveTool(): MoveToolApi {
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const smartGuidesRef = useRef<SmartGuide[]>([]);

  const selectedObjectIds = useEditorStore((s) => s.selectedObjectIds);
  const setSelectedObjects = useEditorStore((s) => s.setSelectedObjects);
  const updateObject = useEditorStore((s) => s.updateObject);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const snapToGuides = useEditorStore((s) => s.snappingEnabled);

  // Attach transformer to selected nodes
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const stage = tr.getStage();
    if (!stage) return;

    const nodes = selectedObjectIds
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedObjectIds]);

  const onSelect = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const target = e.target;
      const id = target.id();
      if (!id) return;

      if (e.evt.shiftKey) {
        // Toggle multi-select
        if (selectedObjectIds.includes(id)) {
          setSelectedObjects(selectedObjectIds.filter((i) => i !== id));
        } else {
          setSelectedObjects([...selectedObjectIds, id]);
        }
      } else {
        setSelectedObjects([id]);
      }
    },
    [selectedObjectIds, setSelectedObjects],
  );

  const onStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Clicked on stage background - deselect
      if (e.target === e.target.getStage()) {
        setSelectedObjects([]);
      }
    },
    [setSelectedObjects],
  );

  const onDragStart = useCallback((_e: Konva.KonvaEventObject<DragEvent>) => {
    // No-op -- selection already handled by onClick
  }, []);

  const onDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      if (!snapToGuides) return;

      const stage = node.getStage();
      if (!stage) return;

      const allNodes = stage
        .find("Rect, Ellipse, Text, Image, Line, Arrow, RegularPolygon, Star")
        .filter((n) => n.id() && n.id() !== node.id());

      const guides = findSmartGuides(node, allNodes, canvasSize.width, canvasSize.height, 5);
      smartGuidesRef.current = guides;

      if (guides.length > 0) {
        const box = node.getClientRect({
          relativeTo: node.getParent() ?? undefined,
        });
        const snapped = snapPosition(
          { x: node.x(), y: node.y() },
          guides,
          { width: box.width, height: box.height },
          5,
        );
        node.position(snapped);
      }
    },
    [canvasSize, snapToGuides],
  );

  const onDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      smartGuidesRef.current = [];
      updateObject(node.id(), {
        x: node.x(),
        y: node.y(),
      });
    },
    [updateObject],
  );

  const onTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Normalize scale into width/height
      const newWidth = Math.max(1, node.width() * scaleX);
      const newHeight = Math.max(1, node.height() * scaleY);
      node.scaleX(1);
      node.scaleY(1);

      updateObject(node.id(), {
        x: node.x(),
        y: node.y(),
        width: newWidth,
        height: newHeight,
        rotation: node.rotation(),
      });
    },
    [updateObject],
  );

  const nudge = useCallback(
    (dx: number, dy: number) => {
      for (const id of selectedObjectIds) {
        const obj = useEditorStore.getState().objects.find((o) => o.id === id);
        if (!obj) continue;
        const attrs = obj.attrs as unknown as Record<string, unknown>;
        updateObject(id, {
          x: ((attrs.x as number) ?? 0) + dx,
          y: ((attrs.y as number) ?? 0) + dy,
        });
      }
    },
    [selectedObjectIds, updateObject],
  );

  return {
    transformerRef,
    smartGuides: smartGuidesRef.current,
    onSelect,
    onStageClick,
    onDragStart,
    onDragMove,
    onDragEnd,
    onTransformEnd,
    nudge,
  };
}

// ---------------------------------------------------------------------------
// MoveToolTransformer -- Konva Transformer component
// ---------------------------------------------------------------------------

export function MoveToolTransformer({
  transformerRef,
}: {
  transformerRef: React.RefObject<Konva.Transformer | null>;
}) {
  return (
    <Transformer
      ref={transformerRef}
      rotateEnabled
      flipEnabled
      keepRatio={false}
      anchorSize={8}
      anchorStroke="#3b82f6"
      anchorFill="#ffffff"
      anchorCornerRadius={2}
      borderStroke="#3b82f6"
      borderStrokeWidth={1}
      padding={2}
    />
  );
}
