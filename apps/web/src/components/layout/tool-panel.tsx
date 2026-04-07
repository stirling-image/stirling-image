import { CATEGORIES, TOOLS } from "@stirling-image/shared";
import { Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { SearchBar } from "../common/search-bar";
import { ToolCard } from "../common/tool-card";

export function ToolPanel() {
  const [search, setSearch] = useState("");
  const { variant, disabledTools, experimentalEnabled, variantUnavailableTools, loaded, fetch } =
    useSettingsStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const unavailableSet = useMemo(() => new Set(variantUnavailableTools), [variantUnavailableTools]);

  const visibleTools = useMemo(() => {
    if (!loaded) return [];
    return TOOLS.filter((t) => {
      if (disabledTools.includes(t.id)) return false;
      if (t.experimental && !experimentalEnabled) return false;
      return true;
    });
  }, [disabledTools, experimentalEnabled, loaded]);

  const filteredTools = useMemo(() => {
    if (!search) return visibleTools;
    const q = search.toLowerCase();
    return visibleTools.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [search, visibleTools]);

  const groupedTools = useMemo(() => {
    const groups = new Map<string, typeof TOOLS>();
    for (const tool of filteredTools) {
      const list = groups.get(tool.category) || [];
      list.push(tool);
      groups.set(tool.category, list);
    }
    return groups;
  }, [filteredTools]);

  return (
    <div className="w-72 border-r border-border bg-background overflow-y-auto flex flex-col shrink-0">
      <div className="p-3 sticky top-0 bg-background z-10">
        <SearchBar value={search} onChange={setSearch} />
      </div>
      <div className="px-3 pb-4 flex-1">
        {variant === "lite" && (
          <div className="mb-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="text-xs leading-relaxed">
                <p className="font-medium">Lite mode</p>
                <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                  AI tools are unavailable. Use the{" "}
                  <code className="font-mono text-[10px] bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">
                    latest
                  </code>{" "}
                  or{" "}
                  <code className="font-mono text-[10px] bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">
                    full
                  </code>{" "}
                  tag for all features.
                </p>
              </div>
            </div>
          </div>
        )}
        {CATEGORIES.filter((cat) => groupedTools.has(cat.id)).map((category) => (
          <div key={category.id} className="mb-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
              {category.name}
            </h3>
            <div className="space-y-0.5">
              {groupedTools.get(category.id)?.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  variantUnavailable={unavailableSet.has(tool.id)}
                />
              ))}
            </div>
          </div>
        ))}
        {filteredTools.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No tools found</p>
        )}
      </div>
    </div>
  );
}
