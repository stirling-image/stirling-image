// apps/web/src/components/editor/editor-toolbar.tsx
//
// Toolbar layout, icons, and shortcuts follow the standard Photoshop
// convention so users coming from other editors feel at home.
import {
  Blend,
  BoxSelect,
  Crop,
  Droplet,
  Droplets,
  Eraser,
  Fingerprint,
  Flame,
  Hand,
  Hexagon,
  Lasso,
  Maximize2,
  MousePointer2,
  PaintBucket,
  Paintbrush,
  Pencil,
  Pipette,
  Stamp,
  Sun,
  Triangle,
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
    tools: [
      { tool: "move", icon: MousePointer2, label: "Move", shortcut: "V" },
      { tool: "transform", icon: Maximize2, label: "Free Transform", shortcut: "Ctrl+T" },
    ],
  },
  {
    tools: [
      { tool: "marquee-rect", icon: BoxSelect, label: "Marquee", shortcut: "M" },
      { tool: "lasso-free", icon: Lasso, label: "Lasso", shortcut: "L" },
      { tool: "magic-wand", icon: Wand2, label: "Magic Wand", shortcut: "W" },
    ],
  },
  {
    tools: [
      { tool: "crop", icon: Crop, label: "Crop", shortcut: "C" },
      { tool: "eyedropper", icon: Pipette, label: "Eyedropper", shortcut: "I" },
    ],
  },
  {
    tools: [
      { tool: "brush", icon: Paintbrush, label: "Brush", shortcut: "B" },
      { tool: "pencil", icon: Pencil, label: "Pencil", shortcut: "N" },
    ],
  },
  {
    tools: [{ tool: "clone-stamp", icon: Stamp, label: "Clone Stamp", shortcut: "S" }],
  },
  {
    tools: [{ tool: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" }],
  },
  {
    tools: [
      { tool: "fill", icon: PaintBucket, label: "Paint Bucket", shortcut: "G" },
      { tool: "gradient", icon: Blend, label: "Gradient", shortcut: "Shift+G" },
    ],
  },
  {
    tools: [
      { tool: "blur-brush", icon: Droplet, label: "Blur", shortcut: "" },
      { tool: "sharpen-brush", icon: Triangle, label: "Sharpen", shortcut: "" },
      { tool: "smudge", icon: Fingerprint, label: "Smudge", shortcut: "" },
    ],
  },
  {
    tools: [
      { tool: "dodge", icon: Sun, label: "Dodge", shortcut: "O" },
      { tool: "burn", icon: Flame, label: "Burn", shortcut: "Shift+O" },
      { tool: "sponge", icon: Droplets, label: "Sponge", shortcut: "Shift+O" },
    ],
  },
  {
    tools: [{ tool: "shape-rect", icon: Hexagon, label: "Shape", shortcut: "U" }],
  },
  {
    tools: [{ tool: "text", icon: Type, label: "Text", shortcut: "T" }],
  },
  {
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
