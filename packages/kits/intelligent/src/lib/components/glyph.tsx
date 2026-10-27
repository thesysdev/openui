"use client";

import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic.mjs";

const names = new Set<string>(iconNames);

/** "MapPin", "map_pin" and "map pin" all mean the lucide icon "map-pin". */
function iconName(value: unknown): IconName | null {
  if (typeof value !== "string") return null;
  const name = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
  return names.has(name) ? (name as IconName) : null;
}

/** A lucide icon, loaded on first use. Unknown names render nothing. */
export function Glyph({ name, size = 18, className }: { name: unknown; size?: number; className?: string }) {
  const icon = iconName(name);
  if (!icon) return null;
  return (
    <DynamicIcon
      name={icon}
      size={size}
      strokeWidth={1.8}
      aria-hidden
      className={className}
      fallback={() => <span className={className} style={{ display: "inline-block", width: size, height: size, flex: "none" }} />}
    />
  );
}
