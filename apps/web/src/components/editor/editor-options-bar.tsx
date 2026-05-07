// apps/web/src/components/editor/editor-options-bar.tsx

import { useEditorStore } from "@/stores/editor-store";
import type { ToolType } from "@/types/editor";
import { BrushOptions } from "./options/brush-options";
import { CloneStampOptions } from "./options/clone-stamp-options";
import { CropOptions } from "./options/crop-options";
import { DodgeBurnOptions } from "./options/dodge-burn-options";
import { FillOptions } from "./options/fill-options";
import { GradientOptions } from "./options/gradient-options";
import { MoveOptions } from "./options/move-options";
import { PixelBrushOptions } from "./options/pixel-brush-options";
import { SelectionOptions } from "./options/selection-options";
import { ShapeOptions } from "./options/shape-options";
import { TextOptions } from "./options/text-options";

function getOptionsComponent(tool: ToolType): React.ComponentType | null {
  switch (tool) {
    case "move":
      return MoveOptions;
    case "marquee-rect":
    case "marquee-ellipse":
    case "lasso-free":
    case "lasso-poly":
    case "magic-wand":
      return SelectionOptions;
    case "crop":
      return CropOptions;
    case "brush":
    case "eraser":
    case "pencil":
      return BrushOptions;
    case "clone-stamp":
      return CloneStampOptions;
    case "dodge":
    case "burn":
    case "sponge":
      return DodgeBurnOptions;
    case "blur-brush":
    case "sharpen-brush":
    case "smudge":
      return PixelBrushOptions;
    case "fill":
      return FillOptions;
    case "gradient":
      return GradientOptions;
    case "shape-rect":
    case "shape-ellipse":
    case "shape-line":
    case "shape-arrow":
    case "shape-polygon":
    case "shape-star":
      return ShapeOptions;
    case "text":
      return TextOptions;
    case "transform":
    case "eyedropper":
    case "hand":
    case "zoom":
      return null;
    default:
      return null;
  }
}

export function EditorOptionsBar() {
  const activeTool = useEditorStore((s) => s.activeTool);

  const OptionsComponent = getOptionsComponent(activeTool);

  return (
    <div className="flex items-center h-10 px-3 bg-card border-b border-border gap-3">
      <span className="text-xs font-medium text-muted-foreground capitalize">
        {activeTool.replace(/-/g, " ").replace(/^shape /, "")}
      </span>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2 flex-1">
        {OptionsComponent && <OptionsComponent />}
      </div>
    </div>
  );
}
