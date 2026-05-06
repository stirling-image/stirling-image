// apps/web/src/pages/editor-page.tsx
import { useCallback, useEffect } from "react";
import { WelcomeScreen } from "@/components/editor/common/welcome-screen";
import { EditorCanvas } from "@/components/editor/editor-canvas";
import { EditorOptionsBar } from "@/components/editor/editor-options-bar";
import { EditorRightPanel } from "@/components/editor/editor-right-panel";
import { EditorStatusBar } from "@/components/editor/editor-status-bar";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { useEditorStore } from "@/stores/editor-store";

export function EditorPage() {
  const sourceImageUrl = useEditorStore((s) => s.sourceImageUrl);
  const isDirty = useEditorStore((s) => s.isDirty);
  const loadImage = useEditorStore((s) => s.loadImage);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => loadImage(url, img.naturalWidth, img.naturalHeight);
          img.src = url;
          return;
        }
      }
    },
    [loadImage],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    if (url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => loadImage(url, img.naturalWidth, img.naturalHeight);
      img.src = url;
    }
  }, [loadImage]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <EditorOptionsBar />
      <div className="flex flex-1 overflow-hidden">
        <EditorToolbar />
        <div className="relative flex-1 overflow-hidden bg-muted/30">
          <EditorCanvas />
          {!sourceImageUrl && <WelcomeScreen />}
        </div>
        <EditorRightPanel />
      </div>
      <EditorStatusBar />
    </div>
  );
}
