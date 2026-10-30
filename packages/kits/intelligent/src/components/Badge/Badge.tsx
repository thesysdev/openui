import { Tag } from "@openuidev/react-components";
import clsx from "clsx";
import { Glyph } from "../Icon/Glyph";
import { names, styles } from "./badge.styles";

const VARIANT = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
  purple: "neutral",
  pink: "neutral",
} as const;

export interface BadgeProps {
  text: string;
  color?: keyof typeof VARIANT | null;
  /** A lucide icon name, shown before the text. */
  icon?: string | null;
}

/** A pill: react-components' Tag, with the kit's purple and pink, which Tag has no variant for. */
export function Badge({ text, color: colorProp, icon }: BadgeProps) {
  const color = colorProp ?? "neutral";
  return (
    <Tag
      text={text}
      variant={VARIANT[color]}
      size="sm"
      icon={icon ? <Glyph name={icon} size={14} /> : undefined}
      className={clsx(styles.root, names.root, (color === "purple" || color === "pink") && [styles.color[color], names.color[color]])}
    />
  );
}
