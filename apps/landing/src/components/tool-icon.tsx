"use client";

import { icons } from "lucide-react";

export function ToolIcon({
  name,
  color,
  size = 32,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) return null;
  return <Icon size={size} style={{ color }} />;
}
