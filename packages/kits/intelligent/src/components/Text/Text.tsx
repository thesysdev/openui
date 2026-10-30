import clsx from "clsx";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { fg, type Color } from "../../shared/style";
import { names, styles } from "./text.styles";

export interface TextProps extends Omit<HTMLAttributes<HTMLParagraphElement>, "color"> {
  size?: "xs" | "sm" | "md" | "lg";
  color?: Color;
  weight?: "normal" | "medium" | "semibold";
  italic?: boolean;
  lineThrough?: boolean;
  tabularNums?: boolean;
  /** Clamps the paragraph to this many lines. */
  maxLines?: number;
}

/** A paragraph. */
const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ size, color, weight, italic, lineThrough, tabularNums, maxLines, className, style, children, ...rest }, ref) => {
    const lines = maxLines && maxLines > 0 ? Math.round(maxLines) : undefined;
    return (
      <p
        ref={ref}
        className={clsx(
          styles.root,
          names.root,
          size ? [styles.size[size], names.size[size]] : names.size.default,
          weight && [styles.weight[weight], names.weight[weight]],
          lines && [styles.clamp, names.clamp],
          className,
        )}
        style={{
          color: fg(color),
          fontStyle: italic ? "italic" : undefined,
          textDecoration: lineThrough ? "line-through" : undefined,
          fontVariantNumeric: tabularNums ? "tabular-nums" : undefined,
          WebkitLineClamp: lines,
          ...style,
        }}
        {...rest}
      >
        {children}
      </p>
    );
  },
);

Text.displayName = "Text";

/** Holds a component (an Icon, a Badge, a Math) in a line of Text, aligned with the words. */
function TextInline({ children }: { children?: ReactNode }) {
  return <span className={clsx(styles.inline, names.inline)}>{children}</span>;
}

export { Text, TextInline };
