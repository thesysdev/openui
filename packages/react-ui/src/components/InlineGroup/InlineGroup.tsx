import clsx from "clsx";
import type { ReactNode } from "react";

/** Lays several small pieces (a Metric and a Tag, two Tags) out on one line. */
export const InlineGroup = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <span className={clsx("openui-inline-group", className)}>{children}</span>;
