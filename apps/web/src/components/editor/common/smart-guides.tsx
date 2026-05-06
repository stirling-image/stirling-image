import { Group, Line } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
export interface SmartGuide {
  orientation: "horizontal" | "vertical";
  position: number;
  type: "edge" | "center" | "canvas";
}

// ---------------------------------------------------------------------------
// Smart guide calculation utilities (exported for testing)
// ---------------------------------------------------------------------------

const SNAP_THRESHOLD = 5;

interface ObjectBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function findAlignmentGuides(
  dragging: ObjectBounds,
  others: ObjectBounds[],
  canvasWidth: number,
  canvasHeight: number,
  threshold = SNAP_THRESHOLD,
): SmartGuide[] {
  const guides: SmartGuide[] = [];

  const dragEdges = {
    left: dragging.x,
    right: dragging.x + dragging.width,
    centerX: dragging.x + dragging.width / 2,
    top: dragging.y,
    bottom: dragging.y + dragging.height,
    centerY: dragging.y + dragging.height / 2,
  };

  // Canvas alignment
  const canvasTargets = [
    { pos: 0, orient: "vertical" as const, type: "canvas" as const },
    {
      pos: canvasWidth / 2,
      orient: "vertical" as const,
      type: "canvas" as const,
    },
    { pos: canvasWidth, orient: "vertical" as const, type: "canvas" as const },
    { pos: 0, orient: "horizontal" as const, type: "canvas" as const },
    {
      pos: canvasHeight / 2,
      orient: "horizontal" as const,
      type: "canvas" as const,
    },
    {
      pos: canvasHeight,
      orient: "horizontal" as const,
      type: "canvas" as const,
    },
  ];

  for (const ct of canvasTargets) {
    const edges =
      ct.orient === "vertical"
        ? [dragEdges.left, dragEdges.centerX, dragEdges.right]
        : [dragEdges.top, dragEdges.centerY, dragEdges.bottom];

    for (const edge of edges) {
      if (Math.abs(edge - ct.pos) < threshold) {
        guides.push({
          orientation: ct.orient,
          position: ct.pos,
          type: ct.type,
        });
      }
    }
  }

  // Object-to-object alignment
  for (const other of others) {
    if (other.id === dragging.id) continue;

    const otherEdges = {
      left: other.x,
      right: other.x + other.width,
      centerX: other.x + other.width / 2,
      top: other.y,
      bottom: other.y + other.height,
      centerY: other.y + other.height / 2,
    };

    // Vertical guides (x-axis alignment)
    const vPairs: [number, number, "edge" | "center"][] = [
      [dragEdges.left, otherEdges.left, "edge"],
      [dragEdges.left, otherEdges.right, "edge"],
      [dragEdges.right, otherEdges.left, "edge"],
      [dragEdges.right, otherEdges.right, "edge"],
      [dragEdges.centerX, otherEdges.centerX, "center"],
    ];

    for (const [dragVal, otherVal, type] of vPairs) {
      if (Math.abs(dragVal - otherVal) < threshold) {
        guides.push({ orientation: "vertical", position: otherVal, type });
      }
    }

    // Horizontal guides (y-axis alignment)
    const hPairs: [number, number, "edge" | "center"][] = [
      [dragEdges.top, otherEdges.top, "edge"],
      [dragEdges.top, otherEdges.bottom, "edge"],
      [dragEdges.bottom, otherEdges.top, "edge"],
      [dragEdges.bottom, otherEdges.bottom, "edge"],
      [dragEdges.centerY, otherEdges.centerY, "center"],
    ];

    for (const [dragVal, otherVal, type] of hPairs) {
      if (Math.abs(dragVal - otherVal) < threshold) {
        guides.push({ orientation: "horizontal", position: otherVal, type });
      }
    }
  }

  return guides;
}

export function snapToGuides(
  pos: { x: number; y: number },
  size: { width: number; height: number },
  guides: SmartGuide[],
  threshold = SNAP_THRESHOLD,
): { x: number; y: number } {
  let { x, y } = pos;

  for (const g of guides) {
    if (g.orientation === "vertical") {
      // Snap left edge, center, or right edge
      if (Math.abs(x - g.position) < threshold) {
        x = g.position;
      } else if (Math.abs(x + size.width / 2 - g.position) < threshold) {
        x = g.position - size.width / 2;
      } else if (Math.abs(x + size.width - g.position) < threshold) {
        x = g.position - size.width;
      }
    } else {
      if (Math.abs(y - g.position) < threshold) {
        y = g.position;
      } else if (Math.abs(y + size.height / 2 - g.position) < threshold) {
        y = g.position - size.height / 2;
      } else if (Math.abs(y + size.height - g.position) < threshold) {
        y = g.position - size.height;
      }
    }
  }

  return { x, y };
}

// ---------------------------------------------------------------------------
// SmartGuidesOverlay -- renders temporary guide lines during drag
// ---------------------------------------------------------------------------

const GUIDE_COLORS: Record<SmartGuide["type"], string> = {
  edge: "#f43f5e",
  center: "#8b5cf6",
  canvas: "#22c55e",
};

export function SmartGuidesOverlay({ guides }: { guides: SmartGuide[] }) {
  const canvasSize = useEditorStore((s) => s.canvasSize);

  if (guides.length === 0) return null;

  // Deduplicate guides by position + orientation
  const seen = new Set<string>();
  const unique = guides.filter((g) => {
    const key = `${g.orientation}-${g.position}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <Group listening={false}>
      {unique.map((g) => {
        const color = GUIDE_COLORS[g.type];
        if (g.orientation === "vertical") {
          return (
            <Line
              key={`sg-${g.orientation}-${g.position}`}
              points={[g.position, 0, g.position, canvasSize.height]}
              stroke={color}
              strokeWidth={0.5}
              dash={[4, 4]}
              listening={false}
            />
          );
        }
        return (
          <Line
            key={`sg-${g.orientation}-${g.position}`}
            points={[0, g.position, canvasSize.width, g.position]}
            stroke={color}
            strokeWidth={0.5}
            dash={[4, 4]}
            listening={false}
          />
        );
      })}
    </Group>
  );
}
