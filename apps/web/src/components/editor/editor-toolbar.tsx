// apps/web/src/components/editor/editor-toolbar.tsx
import {
  ArrowUpRight,
  Crop,
  Eraser,
  Hand,
  MousePointer2,
  Move,
  PaintBucket,
  Paintbrush,
  Pen,
  Pencil,
  Pipette,
  ScanLine,
  Square,
  Stamp,
  Sun,
  Type,
  Wand2,
  ZoomIn,
} from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import type { ToolType } from "@/types/editor";
import { IconButton } from "./common/icon-button";

interface ToolGroup {
  tools: {
    tool: ToolType;
    icon: typeof MousePointer2;
    label: string;
    shortcut: string;
  }[];
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    // Group 1: Move + Free Transform
    tools: [
      { tool: "move", icon: MousePointer2, label: "Move", shortcut: "V" },
      {
        tool: "transform",
        icon: Move,
        label: "Free Transform",
        shortcut: "Ctrl+T",
      },
    ],
  },
  {
    // Group 2: Selection tools
    tools: [
      {
        tool: "marquee-rect",
        icon: Square,
        label: "Marquee",
        shortcut: "M",
      },
      { tool: "lasso-free", icon: Pen, label: "Lasso", shortcut: "L" },
      {
        tool: "magic-wand",
        icon: Wand2,
        label: "Magic Wand",
        shortcut: "W",
      },
    ],
  },
  {
    // Group 3: Crop
    tools: [{ tool: "crop", icon: Crop, label: "Crop", shortcut: "C" }],
  },
  {
    // Group 4: Eyedropper
    tools: [
      {
        tool: "eyedropper",
        icon: Pipette,
        label: "Eyedropper",
        shortcut: "I",
      },
    ],
  },
  {
    // Group 5: Brush, Eraser, Pencil
    tools: [
      { tool: "brush", icon: Paintbrush, label: "Brush", shortcut: "B" },
      { tool: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
      { tool: "pencil", icon: Pencil, label: "Pencil", shortcut: "N" },
    ],
  },
  {
    // Group 6: Clone Stamp
    tools: [
      {
        tool: "clone-stamp",
        icon: Stamp,
        label: "Clone Stamp",
        shortcut: "S",
      },
    ],
  },
  {
    // Group 7: Dodge, Burn, Sponge
    tools: [
      { tool: "dodge", icon: Sun, label: "Dodge", shortcut: "O" },
      { tool: "burn", icon: Sun, label: "Burn", shortcut: "Shift+O" },
      { tool: "sponge", icon: Sun, label: "Sponge", shortcut: "Shift+O" },
    ],
  },
  {
    // Group 8: Blur brush, Sharpen brush, Smudge
    tools: [
      { tool: "blur-brush", icon: ScanLine, label: "Blur Brush", shortcut: "" },
      {
        tool: "sharpen-brush",
        icon: ScanLine,
        label: "Sharpen Brush",
        shortcut: "",
      },
      { tool: "smudge", icon: ScanLine, label: "Smudge", shortcut: "" },
    ],
  },
  {
    // Group 9: Paint Bucket, Gradient
    tools: [
      {
        tool: "fill",
        icon: PaintBucket,
        label: "Paint Bucket",
        shortcut: "G",
      },
      {
        tool: "gradient",
        icon: ArrowUpRight,
        label: "Gradient",
        shortcut: "Shift+G",
      },
    ],
  },
  {
    // Group 10: Shapes
    tools: [{ tool: "shape-rect", icon: Square, label: "Shape", shortcut: "U" }],
  },
  {
    // Group 11: Text
    tools: [{ tool: "text", icon: Type, label: "Text", shortcut: "T" }],
  },
  {
    // Group 12: Hand, Zoom
    tools: [
      { tool: "hand", icon: Hand, label: "Hand", shortcut: "H" },
      { tool: "zoom", icon: ZoomIn, label: "Zoom", shortcut: "Z" },
    ],
  },
];

export function EditorToolbar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setTool = useEditorStore((s) => s.setTool);
  const sourceImageUrl = useEditorStore((s) => s.sourceImageUrl);

  return (
    <div className="flex flex-col items-center w-12 bg-card border-r border-border py-2 gap-0.5 overflow-y-auto">
      {TOOL_GROUPS.map((group, gi) => (
        <div key={group.tools[0].tool}>
          {gi > 0 && <div className="w-6 h-px bg-border mx-auto my-1" />}
          {group.tools.map((t) => (
            <IconButton
              key={t.tool}
              icon={t.icon}
              label={t.label}
              shortcut={t.shortcut}
              active={activeTool === t.tool}
              disabled={!sourceImageUrl && t.tool !== "hand" && t.tool !== "zoom"}
              onClick={() => setTool(t.tool)}
              data-testid={`tool-${t.tool}`}
              data-tool={t.tool}
              data-tool-active={String(activeTool === t.tool)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
