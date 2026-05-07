// apps/web/src/components/editor/tools/text-tool.tsx

import type Konva from "konva";
import { useCallback, useEffect, useRef } from "react";
import { generateId } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import type { CanvasObject, TextAttrs } from "@/types/editor";

/**
 * Text tool hook. Clicking the canvas with the text tool active creates a
 * temporary <textarea> overlay for inline editing.  When the user finishes
 * typing (blur / Escape / Enter without Shift), the text is committed as a
 * Konva Text object in the store.
 */
export function useTextTool() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingRef = useRef<{
    objectId: string;
    x: number;
    y: number;
  } | null>(null);

  // Clean up any lingering textarea on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      textareaRef.current?.remove();
      textareaRef.current = null;
    };
  }, []);

  const commitText = useCallback(() => {
    const textarea = textareaRef.current;
    const pending = pendingRef.current;
    if (!textarea || !pending) return;

    const text = textarea.value.trim();
    abortRef.current?.abort();
    abortRef.current = null;
    textarea.remove();
    textareaRef.current = null;
    pendingRef.current = null;

    useEditorStore.getState().setTool("text");

    if (!text) {
      // Empty text -- remove the placeholder object
      useEditorStore.getState().removeObjects([pending.objectId]);
      return;
    }

    // Update the placeholder object with the final text
    useEditorStore.getState().updateObject(pending.objectId, { text });

    // Re-add the object so history records it (updateObject is silent)
    const state = useEditorStore.getState();
    const obj = state.objects.find((o) => o.id === pending.objectId);
    if (obj) {
      state.setSelectedObjects([pending.objectId]);
    }
  }, []);

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // If there's already a textarea open, commit it first
      if (textareaRef.current) {
        commitText();
        return;
      }

      const stage = e.target.getStage();
      if (!stage) return;

      const { activeTool, foregroundColor, zoom, panOffset, activeLayerId } =
        useEditorStore.getState();

      if (activeTool !== "text") return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const x = (pointer.x - panOffset.x) / zoom;
      const y = (pointer.y - panOffset.y) / zoom;

      const id = generateId();
      const fontSize = 24;

      const attrs: TextAttrs = {
        x,
        y,
        text: "",
        fontFamily: "Arial",
        fontSize,
        fontStyle: "normal",
        fontVariant: "normal",
        textDecoration: "",
        align: "left",
        fill: foregroundColor,
        lineHeight: 1.2,
        letterSpacing: 0,
        rotation: 0,
        opacity: 1,
      };

      const obj: CanvasObject = {
        id,
        type: "text",
        layerId: activeLayerId,
        attrs,
      };

      useEditorStore.getState().addObject(obj);
      pendingRef.current = { objectId: id, x, y };

      // Create textarea overlay at the click position
      const container = stage.container();
      const containerRect = container.getBoundingClientRect();

      const textarea = document.createElement("textarea");
      textarea.style.position = "fixed";
      textarea.style.left = `${pointer.x + containerRect.left}px`;
      textarea.style.top = `${pointer.y + containerRect.top}px`;
      textarea.style.fontSize = `${fontSize * zoom}px`;
      textarea.style.fontFamily = "Arial";
      textarea.style.color = foregroundColor;
      textarea.style.background = "transparent";
      textarea.style.border = "1px dashed rgba(59, 130, 246, 0.6)";
      textarea.style.outline = "none";
      textarea.style.padding = "2px 4px";
      textarea.style.margin = "0";
      textarea.style.minWidth = "60px";
      textarea.style.minHeight = `${fontSize * zoom * 1.4}px`;
      textarea.style.resize = "none";
      textarea.style.overflow = "hidden";
      textarea.style.zIndex = "1000";
      textarea.style.lineHeight = "1.2";
      textarea.style.letterSpacing = "0px";
      textarea.style.whiteSpace = "pre";
      textarea.style.transformOrigin = "top left";

      document.body.appendChild(textarea);
      textareaRef.current = textarea;

      const ac = new AbortController();
      abortRef.current = ac;
      const { signal } = ac;

      // Auto-resize as user types
      const autoResize = () => {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
        textarea.style.width = "auto";
        textarea.style.width = `${Math.max(60, textarea.scrollWidth + 4)}px`;
      };

      textarea.addEventListener("input", autoResize, { signal });

      textarea.addEventListener(
        "blur",
        () => {
          commitText();
        },
        { signal },
      );

      textarea.addEventListener(
        "keydown",
        (ke) => {
          // Enter without Shift commits; Shift+Enter inserts newline
          if (ke.key === "Enter" && !ke.shiftKey) {
            ke.preventDefault();
            textarea.blur();
          }
          if (ke.key === "Escape") {
            ke.preventDefault();
            textarea.value = "";
            textarea.blur();
          }
        },
        { signal },
      );

      // Focus after a microtask so the click doesn't immediately blur
      requestAnimationFrame(() => textarea.focus());
    },
    [commitText],
  );

  const handleMouseMove = useCallback(() => {
    // Text tool doesn't need mouse-move handling
  }, []);

  const handleMouseUp = useCallback(() => {
    // Text tool doesn't need mouse-up handling
  }, []);

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
