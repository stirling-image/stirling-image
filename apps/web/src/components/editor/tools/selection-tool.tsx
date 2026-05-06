import type Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";
import { Ellipse, Group, Line, Rect } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import type { SelectionState } from "@/types/editor";

type SelectionMode = "new" | "add" | "subtract";
type SelectionType = "rect" | "ellipse" | "lasso";

// ---------------------------------------------------------------------------
// Marching ants animation
// ---------------------------------------------------------------------------

const DASH = [6, 4];
const MARCH_SPEED = 1;

function useMarchingAnts(layerRef: React.RefObject<Konva.Layer | null>) {
  const dashOffsetRef = useRef(0);
  const animRef = useRef<Konva.Animation | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    // Dynamically import Konva for Animation
    import("konva").then((KonvaModule) => {
      const anim = new KonvaModule.default.Animation(() => {
        dashOffsetRef.current -= MARCH_SPEED;
      }, layer);
      animRef.current = anim;
      anim.start();
    });

    return () => {
      animRef.current?.stop();
    };
  }, [layerRef]);

  return dashOffsetRef;
}

// ---------------------------------------------------------------------------
// Magic wand -- flood fill to generate selection mask
// ---------------------------------------------------------------------------

function floodFillMask(
  imageData: ImageData,
  startX: number,
  startY: number,
  tolerance: number,
  contiguous: boolean,
): boolean[][] {
  const { width, height, data } = imageData;
  const mask: boolean[][] = Array.from(
    { length: height },
    () => Array(width).fill(false) as boolean[],
  );

  const sx = Math.round(startX);
  const sy = Math.round(startY);
  if (sx < 0 || sx >= width || sy < 0 || sy >= height) return mask;

  const idx = (sy * width + sx) * 4;
  const targetR = data[idx];
  const targetG = data[idx + 1];
  const targetB = data[idx + 2];

  function colorDist(i: number): number {
    const dr = data[i] - targetR;
    const dg = data[i + 1] - targetG;
    const db = data[i + 2] - targetB;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  if (contiguous) {
    // Scanline flood fill
    const stack: [number, number][] = [[sx, sy]];
    while (stack.length > 0) {
      const item = stack.pop();
      if (!item) break;
      const [cx, cy] = item;
      if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
      if (mask[cy][cx]) continue;
      const ci = (cy * width + cx) * 4;
      if (colorDist(ci) > tolerance) continue;
      mask[cy][cx] = true;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
  } else {
    // Select all matching pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const ci = (y * width + x) * 4;
        if (colorDist(ci) <= tolerance) {
          mask[y][x] = true;
        }
      }
    }
  }

  return mask;
}

function maskToBounds(
  mask: boolean[][],
): { x: number; y: number; width: number; height: number } | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let found = false;

  for (let y = 0; y < mask.length; y++) {
    for (let x = 0; x < mask[y].length; x++) {
      if (mask[y][x]) {
        found = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!found) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

// ---------------------------------------------------------------------------
// Selection mask modification utilities
// ---------------------------------------------------------------------------

export function expandMask(mask: boolean[][], amount: number): boolean[][] {
  const h = mask.length;
  const w = mask[0]?.length ?? 0;
  const result: boolean[][] = Array.from({ length: h }, () => Array(w).fill(false) as boolean[]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y][x]) continue;
      for (let dy = -amount; dy <= amount; dy++) {
        for (let dx = -amount; dx <= amount; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
            if (dx * dx + dy * dy <= amount * amount) {
              result[ny][nx] = true;
            }
          }
        }
      }
    }
  }
  return result;
}

export function contractMask(mask: boolean[][], amount: number): boolean[][] {
  const inverted = mask.map((row) => row.map((v) => !v));
  const expanded = expandMask(inverted, amount);
  return expanded.map((row) => row.map((v) => !v));
}

export function featherMask(mask: boolean[][], radius: number): number[][] {
  const h = mask.length;
  const w = mask[0]?.length ?? 0;
  const result: number[][] = Array.from({ length: h }, () => Array(w).fill(0) as number[]);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y][x]) {
        result[y][x] = 1;
        continue;
      }
      // Distance to nearest mask pixel within radius
      let minDist = radius + 1;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w && mask[ny][nx]) {
            const d = Math.sqrt(dx * dx + dy * dy);
            minDist = Math.min(minDist, d);
          }
        }
      }
      if (minDist <= radius) {
        result[y][x] = 1 - minDist / radius;
      }
    }
  }
  return result;
}

export function invertMask(mask: boolean[][]): boolean[][] {
  return mask.map((row) => row.map((v) => !v));
}

/** Ray-casting point-in-polygon test */
export function pointInPolygon(x: number, y: number, points: number[]): boolean {
  let inside = false;
  const n = points.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = points[i * 2];
    const yi = points[i * 2 + 1];
    const xj = points[j * 2];
    const yj = points[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// ---------------------------------------------------------------------------
// Hook: useSelectionTool
// ---------------------------------------------------------------------------

export interface SelectionToolApi {
  selectionType: SelectionType;
  setSelectionType: (t: SelectionType) => void;
  isDrawing: boolean;
  currentPoints: number[];
  onMouseDown: (pos: { x: number; y: number }, stage?: Konva.Stage) => void;
  onMouseMove: (pos: { x: number; y: number }) => void;
  onMouseUp: () => void;
  onDoubleClick: () => void;
  selectAll: () => void;
  deselect: () => void;
  magicWandSelect: (
    stage: Konva.Stage,
    x: number,
    y: number,
    tolerance: number,
    contiguous: boolean,
  ) => void;
}

export function useSelectionTool(): SelectionToolApi {
  const [selectionType, setSelectionType] = useState<SelectionType>("rect");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const startRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [selectionMode] = useState<SelectionMode>("new");

  const setSelection = useEditorStore((s) => s.setSelection);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const existingSelection = useEditorStore((s) => s.selection);

  const mergeSelection = useCallback(
    (newSel: SelectionState, mode: SelectionMode) => {
      if (mode === "new" || !existingSelection) {
        setSelection(newSel);
        return;
      }

      const eb = existingSelection.bounds;
      const nb = newSel.bounds;

      if (mode === "add") {
        const x = Math.min(eb.x, nb.x);
        const y = Math.min(eb.y, nb.y);
        setSelection({
          ...newSel,
          bounds: {
            x,
            y,
            width: Math.max(eb.x + eb.width, nb.x + nb.width) - x,
            height: Math.max(eb.y + eb.height, nb.y + nb.height) - y,
          },
        });
      } else {
        // subtract: use the new bounds minus overlap (simplified)
        setSelection(newSel);
      }
    },
    [existingSelection, setSelection],
  );

  const onMouseDown = useCallback(
    (pos: { x: number; y: number }, _stage?: Konva.Stage) => {
      setIsDrawing(true);
      startRef.current = pos;
      if (selectionType === "lasso") {
        setCurrentPoints([pos.x, pos.y]);
      } else {
        setCurrentPoints([]);
      }
    },
    [selectionType],
  );

  const onMouseMove = useCallback(
    (pos: { x: number; y: number }) => {
      if (!isDrawing) return;

      if (selectionType === "lasso") {
        setCurrentPoints((prev) => [...prev, pos.x, pos.y]);
      } else {
        const s = startRef.current;
        setCurrentPoints([s.x, s.y, pos.x, pos.y]);
      }
    },
    [isDrawing, selectionType],
  );

  const onMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (selectionType === "lasso") {
      if (currentPoints.length < 6) {
        setSelection(null);
        setCurrentPoints([]);
        return;
      }
      const xs = currentPoints.filter((_, i) => i % 2 === 0);
      const ys = currentPoints.filter((_, i) => i % 2 === 1);
      const bounds = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };
      mergeSelection({ type: "lasso", points: currentPoints, bounds }, selectionMode);
    } else {
      if (currentPoints.length < 4) {
        setCurrentPoints([]);
        return;
      }
      const [x1, y1, x2, y2] = currentPoints;
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const w = Math.abs(x2 - x1);
      const h = Math.abs(y2 - y1);
      if (w < 2 || h < 2) {
        setSelection(null);
        setCurrentPoints([]);
        return;
      }
      mergeSelection(
        {
          type: selectionType,
          points: [],
          bounds: { x, y, width: w, height: h },
        },
        selectionMode,
      );
    }
    setCurrentPoints([]);
  }, [isDrawing, currentPoints, selectionType, selectionMode, mergeSelection, setSelection]);

  const onDoubleClick = useCallback(() => {
    // Close polygonal lasso
    if (selectionType === "lasso" && currentPoints.length >= 6) {
      setIsDrawing(false);
      const xs = currentPoints.filter((_, i) => i % 2 === 0);
      const ys = currentPoints.filter((_, i) => i % 2 === 1);
      mergeSelection(
        {
          type: "lasso",
          points: currentPoints,
          bounds: {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys),
          },
        },
        selectionMode,
      );
      setCurrentPoints([]);
    }
  }, [selectionType, currentPoints, selectionMode, mergeSelection]);

  const selectAll = useCallback(() => {
    setSelection({
      type: "rect",
      points: [],
      bounds: { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height },
    });
  }, [canvasSize, setSelection]);

  const deselect = useCallback(() => {
    setSelection(null);
  }, [setSelection]);

  const magicWandSelect = useCallback(
    (stage: Konva.Stage, x: number, y: number, tolerance: number, contiguous: boolean) => {
      const canvas = stage.toCanvas();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const mask = floodFillMask(imageData, x, y, tolerance, contiguous);
      const bounds = maskToBounds(mask);
      if (!bounds) return;
      mergeSelection({ type: "rect", points: [], bounds }, selectionMode);
    },
    [selectionMode, mergeSelection],
  );

  return {
    selectionType,
    setSelectionType,
    isDrawing,
    currentPoints,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onDoubleClick,
    selectAll,
    deselect,
    magicWandSelect,
  };
}

// ---------------------------------------------------------------------------
// SelectionOverlay -- renders selection outline with marching ants
// ---------------------------------------------------------------------------

export function SelectionOverlay({ layerRef }: { layerRef: React.RefObject<Konva.Layer | null> }) {
  const selection = useEditorStore((s) => s.selection);
  const dashOffset = useMarchingAnts(layerRef);

  if (!selection) return null;

  const { type, bounds, points } = selection;

  if (type === "lasso" && points.length >= 6) {
    return (
      <Group>
        <Line
          points={points}
          closed
          stroke="#000000"
          strokeWidth={1}
          dash={DASH}
          dashOffset={dashOffset.current}
          listening={false}
        />
        <Line
          points={points}
          closed
          stroke="#ffffff"
          strokeWidth={1}
          dash={DASH}
          dashOffset={dashOffset.current + DASH[0]}
          listening={false}
        />
      </Group>
    );
  }

  if (type === "ellipse") {
    const rx = bounds.width / 2;
    const ry = bounds.height / 2;
    return (
      <Group>
        <Ellipse
          x={bounds.x + rx}
          y={bounds.y + ry}
          radiusX={rx}
          radiusY={ry}
          stroke="#000000"
          strokeWidth={1}
          dash={DASH}
          dashOffset={dashOffset.current}
          listening={false}
        />
        <Ellipse
          x={bounds.x + rx}
          y={bounds.y + ry}
          radiusX={rx}
          radiusY={ry}
          stroke="#ffffff"
          strokeWidth={1}
          dash={DASH}
          dashOffset={dashOffset.current + DASH[0]}
          listening={false}
        />
      </Group>
    );
  }

  // Rectangular selection
  return (
    <Group>
      <Rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        stroke="#000000"
        strokeWidth={1}
        dash={DASH}
        dashOffset={dashOffset.current}
        listening={false}
      />
      <Rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        stroke="#ffffff"
        strokeWidth={1}
        dash={DASH}
        dashOffset={dashOffset.current + DASH[0]}
        listening={false}
      />
    </Group>
  );
}

// ---------------------------------------------------------------------------
// ActiveSelectionPreview -- rendered during drag to show selection shape
// ---------------------------------------------------------------------------

export function ActiveSelectionPreview({
  type,
  points,
}: {
  type: SelectionType;
  points: number[];
}) {
  if (type === "lasso" && points.length >= 4) {
    return (
      <Line points={points} stroke="#3b82f6" strokeWidth={1} dash={[4, 4]} listening={false} />
    );
  }

  if (points.length < 4) return null;

  const [x1, y1, x2, y2] = points;
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);

  if (type === "ellipse") {
    return (
      <Ellipse
        x={x + w / 2}
        y={y + h / 2}
        radiusX={w / 2}
        radiusY={h / 2}
        stroke="#3b82f6"
        strokeWidth={1}
        dash={[4, 4]}
        listening={false}
      />
    );
  }

  return (
    <Rect
      x={x}
      y={y}
      width={w}
      height={h}
      stroke="#3b82f6"
      strokeWidth={1}
      dash={[4, 4]}
      listening={false}
    />
  );
}
