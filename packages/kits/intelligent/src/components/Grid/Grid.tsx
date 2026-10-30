import { forwardRef, type HTMLAttributes } from "react";
import { cx, space } from "../../shared/style";

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Equal columns, 1 to 12 (default 2). */
  columns?: number;
  /** Space between cells in 4px steps (default 12px). */
  gap?: number;
  /** In px: columns drop on narrow screens so none is narrower. */
  minChildWidth?: number;
}

/** Equal columns; with minChildWidth, columns drop on narrow screens. */
const Grid = forwardRef<HTMLDivElement, GridProps>(({ columns: columnsProp, gap: gapProp, minChildWidth, className, style, children, ...rest }, ref) => {
  const columns = Math.min(12, Math.max(1, Math.round(columnsProp ?? 2)));
  const gap = space(gapProp) ?? "12px";
  // At most `columns` columns, each at least minChildWidth wide.
  const min = minChildWidth ? `max(${Math.max(0, minChildWidth)}px, (100% - ${columns - 1} * ${gap}) / ${columns})` : null;
  return (
    <div
      ref={ref}
      className={cx("openui-intelligent-grid", className)}
      style={{
        gap,
        gridTemplateColumns: min ? `repeat(auto-fill, minmax(min(100%, ${min}), 1fr))` : `repeat(${columns}, minmax(0, 1fr))`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
});

Grid.displayName = "Grid";

export { Grid };
