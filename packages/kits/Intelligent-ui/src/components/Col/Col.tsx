import clsx from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { flow, flowName } from "../../shared/flow.styles";
import { flexStyle, type Align, type Justify } from "../../shared/style";
import { names, styles } from "./col.styles";

export interface ColProps extends HTMLAttributes<HTMLDivElement> {
  /** Space between children in 4px steps. Without one, blocks are spaced like an article. */
  gap?: number;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
}

/** Vertical layout. */
const Col = forwardRef<HTMLDivElement, ColProps>(({ gap, align, justify, wrap, className, style, children, ...rest }, ref) => (
  <div
    ref={ref}
    className={clsx(styles.root, names.root, gap == null && [flow, flowName], className)}
    style={{ ...flexStyle({ gap, align, justify, wrap }, true), ...style }}
    {...rest}
  >
    {children}
  </div>
));

Col.displayName = "Col";

export { Col };
