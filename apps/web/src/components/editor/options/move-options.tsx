import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowLeftRight,
  ArrowUpDown,
} from "lucide-react";
import { alignObjects } from "@/components/editor/tools/move-tool";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";

// ---------------------------------------------------------------------------
// MoveOptions -- alignment and distribute buttons in the options bar
// ---------------------------------------------------------------------------

function OptionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded",
        "text-muted-foreground hover:bg-muted hover:text-foreground",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "transition-colors",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function MoveOptions() {
  const selectedObjectIds = useEditorStore((s) => s.selectedObjectIds);
  const objects = useEditorStore((s) => s.objects);
  const updateObject = useEditorStore((s) => s.updateObject);
  const canvasSize = useEditorStore((s) => s.canvasSize);

  const hasSelection = selectedObjectIds.length >= 1;
  const hasThreeOrMore = selectedObjectIds.length >= 3;

  const handleAlign = (
    direction:
      | "left"
      | "center-h"
      | "right"
      | "top"
      | "center-v"
      | "bottom"
      | "distribute-h"
      | "distribute-v",
  ) => {
    alignObjects(
      direction,
      selectedObjectIds,
      objects.map((o) => ({ id: o.id, attrs: o.attrs as unknown as Record<string, unknown> })),
      updateObject,
      canvasSize,
    );
  };

  return (
    <div className="flex items-center gap-1">
      <span className="mr-2 text-xs text-muted-foreground">Align:</span>

      <OptionButton
        icon={AlignStartHorizontal}
        label="Align Left"
        onClick={() => handleAlign("left")}
        disabled={!hasSelection}
      />
      <OptionButton
        icon={AlignCenterHorizontal}
        label="Align Center Horizontal"
        onClick={() => handleAlign("center-h")}
        disabled={!hasSelection}
      />
      <OptionButton
        icon={AlignEndHorizontal}
        label="Align Right"
        onClick={() => handleAlign("right")}
        disabled={!hasSelection}
      />

      <div className="mx-1 h-4 w-px bg-border" />

      <OptionButton
        icon={AlignStartVertical}
        label="Align Top"
        onClick={() => handleAlign("top")}
        disabled={!hasSelection}
      />
      <OptionButton
        icon={AlignCenterVertical}
        label="Align Center Vertical"
        onClick={() => handleAlign("center-v")}
        disabled={!hasSelection}
      />
      <OptionButton
        icon={AlignEndVertical}
        label="Align Bottom"
        onClick={() => handleAlign("bottom")}
        disabled={!hasSelection}
      />

      <div className="mx-1 h-4 w-px bg-border" />

      <span className="mr-1 text-xs text-muted-foreground">Distribute:</span>

      <OptionButton
        icon={ArrowLeftRight}
        label="Distribute Horizontally"
        onClick={() => handleAlign("distribute-h")}
        disabled={!hasThreeOrMore}
      />
      <OptionButton
        icon={ArrowUpDown}
        label="Distribute Vertically"
        onClick={() => handleAlign("distribute-v")}
        disabled={!hasThreeOrMore}
      />
    </div>
  );
}
