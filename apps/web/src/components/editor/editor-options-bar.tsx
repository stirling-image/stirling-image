// apps/web/src/components/editor/editor-options-bar.tsx
import { useEditorStore } from "@/stores/editor-store";

export function EditorOptionsBar() {
  const activeTool = useEditorStore((s) => s.activeTool);

  return (
    <div className="flex items-center h-10 px-3 bg-card border-b border-border gap-3">
      <span className="text-xs font-medium text-muted-foreground capitalize">
        {activeTool.replace(/-/g, " ").replace(/^shape /, "")}
      </span>
      <div className="h-4 w-px bg-border" />
      {/* Tool-specific option components are rendered here by each agent */}
      <div id="editor-options-content" className="flex items-center gap-2 flex-1" />
    </div>
  );
}
