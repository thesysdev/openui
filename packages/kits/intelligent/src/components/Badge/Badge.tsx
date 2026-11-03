import { Tag } from "@openuidev/react-components";
import clsx from "clsx";
import { Glyph } from "../Icon/Glyph";
import { badgeStyles, names } from "./badge.styles";

export interface BadgeProps {
  text: string;
  color?: "neutral" | keyof typeof names.color | null;
  /** A lucide icon name, shown before the text. */
  icon?: string | null;
}

/** A pill: react-components' Tag, with the kit's shape and tones. */
export function Badge({ text, color: colorProp, icon }: BadgeProps) {
  const color = colorProp ?? "neutral";
  return (
    <Tag
      text={text}
      size="sm"
      icon={icon ? <Glyph name={icon} size={14} /> : undefined}
      className={clsx(badgeStyles.root, names.root, color !== "neutral" && [badgeStyles.color[color], names.color[color]])}
    />
  );
}
