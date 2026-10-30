import { forwardRef, type HTMLAttributes } from "react";
import { cx, fg, type Color } from "../../shared/style";
import { Glyph } from "./Glyph";

export interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  /** A lucide icon name, e.g. "map-pin". */
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: Color;
}

const ICON_SIZE = { sm: 14, md: 18, lg: 24, xl: 32 } as const;

/** A lucide icon by name. */
const Icon = forwardRef<HTMLSpanElement, IconProps>(({ name, size, color, className, style, ...rest }, ref) => (
  <span ref={ref} className={cx("openui-intelligent-icon", className)} style={{ color: fg(color), ...style }} {...rest}>
    <Glyph name={name} size={ICON_SIZE[size ?? "md"] ?? 18} />
  </span>
));

Icon.displayName = "Icon";

export { Icon };
