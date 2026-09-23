import type { ReactNode } from "react";

import styles from "./InsightBar.module.css";

export interface InsightBarProps {
  children: ReactNode;
  className?: string;
}

/** A compact conclusion placed between evidence and the content it explains. */
export function InsightBar({ children, className = "" }: InsightBarProps) {
  return (
    <aside className={`${styles.bar} ${className}`.trim()}>
      <p>{children}</p>
    </aside>
  );
}
