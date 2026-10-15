import clsx from "clsx";
import type { ReactNode } from "react";

export interface GridProps {
  /** Most columns at full width; narrower containers drop to fewer. */
  columns?: 2 | 3 | 4;
  children?: ReactNode;
  className?: string;
}

/** Equal-width responsive columns for dashboards. */
export const Grid = ({ columns = 2, children, className }: GridProps) => (
  // The outer div is the size container the column breakpoints query.
  <div className={clsx("openui-grid", className)}>
    <div className={clsx("openui-grid__cells", `openui-grid__cells--${columns}`)}>{children}</div>
  </div>
);
