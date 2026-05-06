// apps/web/src/components/editor/common/icon-button.tsx
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  size?: number;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
  "data-testid"?: string;
  "data-tool"?: string;
  "data-tool-active"?: string;
}

export function IconButton({
  icon: Icon,
  label,
  shortcut,
  active,
  disabled,
  size = 18,
  onClick,
  onContextMenu,
  className,
  ...dataProps
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        "relative flex items-center justify-center w-8 h-8 rounded-md transition-colors",
        "hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed",
        active && "bg-primary text-primary-foreground hover:bg-primary/90",
        !active && "text-muted-foreground",
        className,
      )}
      {...dataProps}
    >
      <Icon size={size} />
    </button>
  );
}
