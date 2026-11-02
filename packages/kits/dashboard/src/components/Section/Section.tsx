import clsx from "clsx";
import type { ReactNode } from "react";
import { names, styles } from "./section.styles";

export interface SectionProps {
  filterBar?: ReactNode;
  children?: ReactNode;
}

export function Section({ filterBar, children }: SectionProps) {
  return (
    <section className={clsx(styles.root, names.root)}>
      {filterBar ? <div className={clsx(styles.filter, names.filter)}>{filterBar}</div> : null}
      <div className={clsx(styles.rows, names.rows)}>{children}</div>
    </section>
  );
}
