import type { LucideIcon } from "lucide-react";
import { FolderOpen, Grid3x3, HelpCircle, LayoutGrid, Settings, Workflow } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { OtterLogo } from "../common/otter-logo";

interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href?: string;
}

const topItems: SidebarItem[] = [
  { icon: LayoutGrid, label: "Tools", href: "/" },
  { icon: Grid3x3, label: "Grid", href: "/fullscreen" },
  { icon: Workflow, label: "Automate", href: "/automate" },
  { icon: FolderOpen, label: "Files", href: "/files" },
];

const bottomItems: SidebarItem[] = [
  { icon: HelpCircle, label: "Help" },
  { icon: Settings, label: "Settings" },
];

interface SidebarProps {
  onSettingsClick: () => void;
  onHelpClick: () => void;
  /** Called when a nav link is clicked (e.g., to close mobile sidebar). */
  onNavClick?: () => void;
  /** When true, renders in expanded mode (for mobile overlay). */
  expanded?: boolean;
}

export function Sidebar({
  onSettingsClick,
  onHelpClick,
  onNavClick,
  expanded = false,
}: SidebarProps) {
  const location = useLocation();

  const renderItem = (item: SidebarItem, isActive: boolean) => {
    const content = expanded ? (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <item.icon className="h-5 w-5" />
        <span className="text-sm font-medium">{item.label}</span>
      </div>
    ) : (
      <div
        className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <item.icon className="h-6 w-6" />
        <span className="text-[10px] font-medium">{item.label}</span>
      </div>
    );

    if (item.label === "Settings") {
      return (
        <button key={item.label} type="button" onClick={onSettingsClick} className="w-full">
          {content}
        </button>
      );
    }
    if (item.label === "Help") {
      return (
        <button key={item.label} type="button" onClick={onHelpClick} className="w-full">
          {content}
        </button>
      );
    }
    return (
      <Link key={item.label} to={item.href || "/"} onClick={onNavClick}>
        {content}
      </Link>
    );
  };

  if (expanded) {
    return (
      <div className="flex flex-col p-3 gap-1">
        {topItems.map((item) => renderItem(item, location.pathname === item.href))}
        <div className="border-t border-border my-2" />
        {bottomItems.map((item) => renderItem(item, false))}
      </div>
    );
  }

  return (
    <aside className="flex flex-col items-center w-16 bg-sidebar border-r border-border py-3 gap-1 shrink-0">
      <div className="mb-2 flex items-center justify-center">
        <OtterLogo className="h-7 w-7 text-primary" />
      </div>
      <div className="border-t border-border w-10 mb-2" />
      <div className="flex flex-col gap-1 flex-1">
        {topItems.map((item) => renderItem(item, location.pathname === item.href))}
      </div>
      <div className="border-t border-border w-10 my-2" />
      <div className="flex flex-col gap-1">
        {bottomItems.map((item) => renderItem(item, false))}
      </div>
    </aside>
  );
}
