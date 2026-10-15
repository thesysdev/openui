import clsx from "clsx";
import type { ReactNode } from "react";

export interface SectionProps {
  children?: ReactNode;
  className?: string;
}

/** One part of a response: stacked content with room below it before the next part. */
export const Section = ({ children, className }: SectionProps) => (
  <section className={clsx("openui-section", className)}>{children}</section>
);
