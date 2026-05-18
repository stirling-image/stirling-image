"use client";

import { CATEGORIES, TOOLS } from "@snapotter/shared";
import { icons, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { FadeIn } from "./fade-in";

const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

function getCategoryCount(id: string) {
  return TOOLS.filter((t) => t.category === id).length;
}

export function BentoGrid() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return TOOLS.filter((tool) => {
      if (activeCategory !== "all" && tool.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      const cat = categoryMap.get(tool.category);
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        (cat?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [search, activeCategory]);

  return (
    <section id="features" className="px-6 py-24 md:py-36">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <h2 className="font-[family-name:var(--font-nunito)] text-center text-3xl font-bold tracking-tight md:text-4xl">
            52 tools. Zero cloud dependency.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-muted">
            Search to find exactly what you need. Every tool runs 100% locally.
          </p>
        </FadeIn>

        {/* Search bar */}
        <div className="mx-auto mt-12 max-w-md">
          <div className="relative">
            <Search size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-3 pr-4 pl-11 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="mt-6 flex flex-nowrap gap-2 overflow-x-auto pb-2 md:flex-wrap md:justify-center md:overflow-visible">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-accent text-accent-foreground"
                : "border border-border hover:bg-background-alt"
            }`}
          >
            All ({TOOLS.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-accent text-accent-foreground"
                  : "border border-border hover:bg-background-alt"
              }`}
            >
              {cat.name} ({getCategoryCount(cat.id)})
            </button>
          ))}
        </div>

        {/* Result count */}
        <p className="mt-6 text-center text-sm text-muted">
          Showing {filtered.length} of {TOOLS.length} tools
        </p>

        {/* Tool grid */}
        {filtered.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {filtered.map((tool) => {
              const cat = categoryMap.get(tool.category);
              const Icon = icons[tool.icon as keyof typeof icons];
              return (
                <a
                  key={tool.id}
                  href={`/tools/${tool.id}`}
                  className="tool-card flex flex-col items-center rounded-xl border border-border bg-background-alt px-4 py-6 text-center transition-all hover:shadow-md no-underline text-inherit"
                  style={
                    {
                      "--cat-color": cat?.color,
                    } as React.CSSProperties
                  }
                >
                  {Icon && (
                    <Icon size={30} style={{ color: cat?.color }} className="mb-3 shrink-0" />
                  )}
                  <span className="font-bold text-sm">{tool.name}</span>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{tool.description}</p>
                </a>
              );
            })}
          </div>
        ) : (
          <p className="mt-16 text-center text-muted">No tools found. Try a different search.</p>
        )}
      </div>
    </section>
  );
}
