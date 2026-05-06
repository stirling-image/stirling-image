import type Konva from "konva";
import { useCallback, useRef } from "react";
import { Group, Line } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";

// ---------------------------------------------------------------------------
// GuideLines -- draggable guide lines rendered as Konva.Line
// ---------------------------------------------------------------------------

const GUIDE_COLOR = "#22d3ee"; // cyan-400
const GUIDE_WIDTH = 1;

export function GuideLines() {
  const guides = useEditorStore((s) => s.guides);
  const showGuides = useEditorStore((s) => s.guidesVisible);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const updateGuide = useEditorStore((s) => s.updateGuide);
  const removeGuide = useEditorStore((s) => s.removeGuide);

  if (!showGuides || guides.length === 0) return null;

  return (
    <Group>
      {guides.map((guide) => (
        <DraggableGuide
          key={guide.id}
          id={guide.id}
          orientation={guide.orientation}
          position={guide.position}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
          onPositionChange={(pos) => updateGuide(guide.id, pos)}
          onRemove={() => removeGuide(guide.id)}
        />
      ))}
    </Group>
  );
}

// ---------------------------------------------------------------------------
// DraggableGuide -- individual guide line
// ---------------------------------------------------------------------------

function DraggableGuide({
  id,
  orientation,
  position,
  canvasWidth,
  canvasHeight,
  onPositionChange,
  onRemove,
}: {
  id: string;
  orientation: "horizontal" | "vertical";
  position: number;
  canvasWidth: number;
  canvasHeight: number;
  onPositionChange: (pos: number) => void;
  onRemove: () => void;
}) {
  const lineRef = useRef<Konva.Line>(null);

  const isHorizontal = orientation === "horizontal";

  const points = isHorizontal
    ? [0, position, canvasWidth, position]
    : [position, 0, position, canvasHeight];

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      if (isHorizontal) {
        const newY = node.y() + position;
        node.y(0); // reset drag offset
        onPositionChange(newY);
      } else {
        const newX = node.x() + position;
        node.x(0);
        onPositionChange(newX);
      }
    },
    [isHorizontal, position, onPositionChange],
  );

  const handleDblClick = useCallback(() => {
    onRemove();
  }, [onRemove]);

  return (
    <Line
      ref={lineRef}
      id={`guide-${id}`}
      points={points}
      stroke={GUIDE_COLOR}
      strokeWidth={GUIDE_WIDTH}
      dash={[8, 4]}
      draggable
      dragBoundFunc={(pos) => {
        // Constrain drag to the guide's axis
        if (isHorizontal) {
          return { x: 0, y: pos.y };
        }
        return { x: pos.x, y: 0 };
      }}
      onDragEnd={handleDragEnd}
      onDblClick={handleDblClick}
      hitStrokeWidth={8}
    />
  );
}
