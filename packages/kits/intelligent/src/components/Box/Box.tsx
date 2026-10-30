import clsx from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { flow, flowName } from "../../shared/flow.styles";
import { tokens } from "../../shared/tokens";
import { bg, flexStyle, onColor, radius as radiusOf, size, space, type Align, type Color, type Justify, type Length, type Radius } from "../../shared/style";
import { names as colNames, styles as colStyles } from "../Col/col.styles";
import { names as rowNames, styles as rowStyles } from "../Row/row.styles";
import { names } from "./box.styles";

export interface BoxProps extends Omit<HTMLAttributes<HTMLDivElement>, "color"> {
  /** A column (the default) or a row. */
  direction?: "row" | "col";
  /** Space between children in 4px steps. */
  gap?: number;
  /** Padding in 4px steps. */
  padding?: number;
  /** A colour token or CSS colour; status tokens become their soft tints. */
  background?: Color;
  /** Also clips the content. */
  radius?: Radius;
  border?: boolean;
  width?: Length;
  height?: Length;
  /** Grow factor inside a Row or Col. */
  flex?: number;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
}

/** Flex container, a column by default. */
const Box = forwardRef<HTMLDivElement, BoxProps>(
  ({ direction, gap, padding, background, radius, border, width, height, flex, align, justify, wrap, className, style, children, ...rest }, ref) => {
    const row = direction === "row";
    return (
      <div
        ref={ref}
        className={clsx(names.root, row ? [rowStyles.root, rowNames.root] : [colStyles.root, colNames.root], !row && gap == null && [flow, flowName], className)}
        style={{
          ...flexStyle({ gap, align, justify, wrap }, !row),
          padding: space(padding),
          background: bg(background),
          ...onColor(background),
          borderRadius: radiusOf(radius),
          overflow: radius !== undefined ? "clip" : undefined,
          border: border ? `1px solid ${tokens.border}` : undefined,
          width: size(width),
          height: size(height),
          // null, like an omitted argument, means no flex.
          // A width in px is meant: a Row with long text beside it must not squeeze it.
          flex: flex != null ? `${Math.max(0, flex)} 1 0%` : typeof width === "number" ? "0 0 auto" : undefined,
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

Box.displayName = "Box";

export { Box };
