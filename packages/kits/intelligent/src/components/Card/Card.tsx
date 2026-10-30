import { forwardRef, type HTMLAttributes } from "react";
import { cx, space } from "../../shared/style";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** outline (the default) is a bordered panel; soft is a filled panel for summaries. */
  variant?: "outline" | "soft";
  /** Padding in 4px steps. */
  padding?: number;
  /** Space between children in 4px steps. Without one, blocks are spaced like an article. */
  gap?: number;
}

/** Panel with a border; soft is a filled panel for summaries. */
const Card = forwardRef<HTMLElement, CardProps>(({ variant, padding, gap, className, style, children, ...rest }, ref) => (
  <section
    ref={ref}
    className={cx("iui-card", variant === "soft" && "iui-card-soft", gap == null && "iui-flow", className)}
    style={{ padding: space(padding), gap: space(gap), ...style }}
    {...rest}
  >
    {children}
  </section>
));

Card.displayName = "Card";

export { Card };
