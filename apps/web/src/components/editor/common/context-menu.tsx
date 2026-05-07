import {
  ArrowDown,
  ArrowUp,
  ClipboardPaste,
  Copy,
  CopyPlus,
  ImageIcon,
  Maximize,
  MousePointer,
  Scissors,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";

// ---------------------------------------------------------------------------
// Context menu state
// ---------------------------------------------------------------------------

interface MenuPosition {
  x: number;
  y: number;
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  dividerAfter?: boolean;
}

// ---------------------------------------------------------------------------
// Hook: useContextMenu
// ---------------------------------------------------------------------------

export function useContextMenu() {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [menuType, setMenuType] = useState<"object" | "canvas">("canvas");

  const handleContextMenu = useCallback((e: React.MouseEvent, hasSelectedObject: boolean) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setMenuType(hasSelectedObject ? "object" : "canvas");
  }, []);

  const close = useCallback(() => {
    setPosition(null);
  }, []);

  return { position, menuType, handleContextMenu, close };
}

// ---------------------------------------------------------------------------
// ContextMenu component
// ---------------------------------------------------------------------------

export function ContextMenu({
  position,
  menuType,
  onClose,
  onCanvasResize,
  onImageResize,
}: {
  position: MenuPosition;
  menuType: "object" | "canvas";
  onClose: () => void;
  onCanvasResize?: () => void;
  onImageResize?: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedObjectIds = useEditorStore((s) => s.selectedObjectIds);
  const copyObjects = useEditorStore((s) => s.copyObjects);
  const cutObjects = useEditorStore((s) => s.cutObjects);
  const pasteObjects = useEditorStore((s) => s.pasteObjects);
  const removeObjects = useEditorStore((s) => s.removeObjects);
  const copyObjectsFn = useEditorStore((s) => s.copyObjects);
  const pasteObjectsFn = useEditorStore((s) => s.pasteObjects);
  const bringToFront = useEditorStore((s) => s.bringToFront);
  const bringForward = useEditorStore((s) => s.bringForward);
  const sendBackward = useEditorStore((s) => s.sendBackward);
  const sendToBack = useEditorStore((s) => s.sendToBack);
  const clipboard = useEditorStore((s) => s.clipboard);
  const setSelection = useEditorStore((s) => s.setSelection);
  const canvasSize = useEditorStore((s) => s.canvasSize);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const objectItems: MenuItem[] = [
    {
      label: "Cut",
      icon: Scissors,
      shortcut: "Ctrl+X",
      action: () => {
        cutObjects();
        onClose();
      },
    },
    {
      label: "Copy",
      icon: Copy,
      shortcut: "Ctrl+C",
      action: () => {
        copyObjects();
        onClose();
      },
    },
    {
      label: "Paste",
      icon: ClipboardPaste,
      shortcut: "Ctrl+V",
      action: () => {
        pasteObjects();
        onClose();
      },
      disabled: !clipboard || clipboard.length === 0,
    },
    {
      label: "Duplicate",
      icon: CopyPlus,
      shortcut: "Ctrl+D",
      action: () => {
        copyObjectsFn();
        pasteObjectsFn();
        onClose();
      },
      dividerAfter: true,
    },
    {
      label: "Bring to Front",
      icon: ArrowUp,
      action: () => {
        for (const id of selectedObjectIds) bringToFront(id);
        onClose();
      },
    },
    {
      label: "Bring Forward",
      icon: ArrowUp,
      action: () => {
        for (const id of selectedObjectIds) bringForward(id);
        onClose();
      },
    },
    {
      label: "Send Backward",
      icon: ArrowDown,
      action: () => {
        for (const id of selectedObjectIds) sendBackward(id);
        onClose();
      },
    },
    {
      label: "Send to Back",
      icon: ArrowDown,
      action: () => {
        for (const id of selectedObjectIds) sendToBack(id);
        onClose();
      },
      dividerAfter: true,
    },
    {
      label: "Delete",
      icon: Trash2,
      shortcut: "Del",
      action: () => {
        removeObjects(selectedObjectIds);
        onClose();
      },
    },
  ];

  const canvasItems: MenuItem[] = [
    {
      label: "Paste",
      icon: ClipboardPaste,
      shortcut: "Ctrl+V",
      action: () => {
        pasteObjects();
        onClose();
      },
      disabled: !clipboard || clipboard.length === 0,
    },
    {
      label: "Select All",
      icon: MousePointer,
      shortcut: "Ctrl+A",
      action: () => {
        setSelection({
          type: "rect",
          points: [],
          bounds: {
            x: 0,
            y: 0,
            width: canvasSize.width,
            height: canvasSize.height,
          },
        });
        onClose();
      },
      dividerAfter: true,
    },
    {
      label: "Canvas Size...",
      icon: Maximize,
      action: () => {
        onCanvasResize?.();
        onClose();
      },
    },
    {
      label: "Image Size...",
      icon: ImageIcon,
      action: () => {
        onImageResize?.();
        onClose();
      },
    },
  ];

  const items = menuType === "object" ? objectItems : canvasItems;

  // Adjust position to stay within viewport
  const adjustedX = Math.min(position.x, window.innerWidth - 220);
  const adjustedY = Math.min(position.y, window.innerHeight - items.length * 36);

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-50 min-w-[200px] rounded-lg border border-border bg-card py-1 shadow-lg",
        "animate-in fade-in-0 zoom-in-95",
      )}
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map((item) => (
        <div key={item.label}>
          <button
            type="button"
            onClick={item.action}
            disabled={item.disabled}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm",
              "text-foreground hover:bg-muted transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            <item.icon className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-muted-foreground">{item.shortcut}</span>
            )}
          </button>
          {item.dividerAfter && <div className="my-1 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}
