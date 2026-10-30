import { Tag } from "@openuidev/react-components";
import clsx from "clsx";
import { Glyph } from "../Icon/Glyph";
import { names, styles } from "./badge.styles";

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
      className={clsx(styles.root, names.root, color !== "neutral" && [styles.color[color], names.color[color]])}
    />
  );
}
