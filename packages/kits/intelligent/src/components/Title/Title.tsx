import { forwardRef, type HTMLAttributes } from "react";
import { cx, fg, type Color } from "../../shared/style";

export interface TitleProps extends Omit<HTMLAttributes<HTMLDivElement>, "color"> {
  /** md for a card title, lg for a section, 2xl for a big number. */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  color?: Color;
}

const HEADING_LEVEL: Record<string, number> = { "3xl": 1, "2xl": 2, xl: 2, lg: 2, md: 3, sm: 4 };

/** A heading; its level follows its size. */
const Title = forwardRef<HTMLDivElement, TitleProps>(({ size, color, className, style, children, ...rest }, ref) => {
  const sizeName = size ?? "md";
  return (
    <div
      ref={ref}
      role="heading"
      aria-level={HEADING_LEVEL[sizeName] ?? 3}
      className={cx(`iui-title iui-title-${sizeName}`, className)}
      style={{ color: fg(color), ...style }}
      {...rest}
    >
      {children}
    </div>
  );
});

Title.displayName = "Title";

export { Title };
