import clsx from "clsx";
import type { ReactNode } from "react";
import { names, styles } from "./section.styles";

export interface SectionProps {
  title?: string;
  filterBar?: ReactNode;
  children?: ReactNode;
}

export function Section({ title, filterBar, children }: SectionProps) {
  return (
    <section className={clsx(styles.root, names.root)}>
      {title ? <h2 className={clsx(styles.title, names.title)}>{title}</h2> : null}
      {filterBar ? <div className={clsx(styles.filter, names.filter)}>{filterBar}</div> : null}
      <div className={clsx(styles.rows, names.rows)}>{children}</div>
    </section>
  );
}
