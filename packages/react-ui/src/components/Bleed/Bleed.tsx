import clsx from "clsx";
import type { ReactNode } from "react";

export interface BleedProps {
  children?: ReactNode;
  className?: string;
}

/** Frameless content wider than the chat column, for expressive layouts. */
export const Bleed = ({ children, className }: BleedProps) => (
  <div className={clsx("openui-bleed", className)}>{children}</div>
);
