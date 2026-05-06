// apps/web/src/components/editor/editor-right-panel.tsx
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import { LayersPanel } from "./panels/layers-panel";

const TABS = [
  { id: "layers" as const, label: "Layers" },
  { id: "adjustments" as const, label: "Adjustments" },
  { id: "history" as const, label: "History" },
];

export function EditorRightPanel() {
  const visible = useEditorStore((s) => s.rightPanelVisible);
  const activeTab = useEditorStore((s) => s.rightPanelTab);
  const setTab = useEditorStore((s) => s.setRightPanelTab);
  const togglePanel = useEditorStore((s) => s.toggleRightPanel);

  if (!visible) {
    return (
      <button
        type="button"
        onClick={togglePanel}
        className="flex items-center justify-center w-6 bg-card border-l border-border"
        aria-label="Expand panel"
      >
        <ChevronRight size={14} className="text-muted-foreground rotate-180" />
      </button>
    );
  }

  return (
    <div className="flex flex-col w-[280px] bg-card border-l border-border">
      <div className="flex items-center border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={cn(
              "flex-1 py-2 text-xs font-medium text-center transition-colors",
              activeTab === tab.id
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={togglePanel}
          className="px-1.5 py-2 text-muted-foreground hover:text-foreground"
          aria-label="Collapse panel"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === "layers" && <LayersPanel />}
        {activeTab !== "layers" && <div id={`editor-panel-${activeTab}`} />}
      </div>
      {/* Color panel always visible at bottom (Agent 5) */}
      <div id="editor-color-panel" className="border-t border-border" />
    </div>
  );
}
