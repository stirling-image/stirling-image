import type { Tool } from "@ashim/shared";
import { FileImage, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { ICON_MAP } from "@/lib/icon-map";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const IconComponent =
    (ICON_MAP[tool.icon] as React.ComponentType<{ className?: string }>) ?? FileImage;

  return (
    <div className="group flex items-center gap-3 relative">
      <button
        type="button"
        className="opacity-0 group-hover:opacity-100 transition-opacity absolute -left-5"
        title="Add to favourites"
      >
        <Star className="h-3 w-3 text-muted-foreground hover:text-yellow-500" />
      </button>
      <Link
        to={tool.route}
        className={cn(
          "flex items-center gap-3 py-2 px-3 rounded-lg w-full transition-colors",
          "hover:bg-muted",
          tool.disabled && "opacity-50 pointer-events-none",
        )}
      >
        <IconComponent className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{tool.name}</span>
        {tool.experimental && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-medium">
            Experimental
          </span>
        )}
      </Link>
    </div>
  );
}
