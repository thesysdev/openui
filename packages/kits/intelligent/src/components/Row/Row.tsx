import { forwardRef, type HTMLAttributes } from "react";
import { cx, flexStyle, type Align, type Justify } from "../../shared/style";

export interface RowProps extends HTMLAttributes<HTMLDivElement> {
  /** Space between children in 4px steps. */
  gap?: number;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
}

/** Horizontal layout; items are vertically centered. */
const Row = forwardRef<HTMLDivElement, RowProps>(({ gap, align, justify, wrap, className, style, children, ...rest }, ref) => (
  <div ref={ref} className={cx("iui-row", className)} style={{ ...flexStyle({ gap, align, justify, wrap }), ...style }} {...rest}>
    {children}
  </div>
));

Row.displayName = "Row";

export { Row };
