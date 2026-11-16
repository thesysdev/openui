"use client";

import { IconWrapper } from "@openuidev/react-components";
import clsx from "clsx";
import { iconStyles, names } from "./icon.styles";

/**
 * A lucide icon by name, loaded on first use through react-components' IconWrapper. "MapPin",
 * "map_pin" and "map pin" all mean "map-pin"; a name it can't match draws its fallback icon.
 */
export function Glyph({
  name,
  size = 18,
  className,
}: {
  name: unknown;
  size?: number;
  className?: string;
}) {
  if (typeof name !== "string" || !name.trim()) return null;
  return (
    <IconWrapper
      name={name}
      size={size}
      className={clsx(iconStyles.glyph, names.glyph, className)}
    />
  );
}
