import type { ReactNode } from "react";
import styles from "./sections.module.css";

export interface ListSectionItem {
  term: string;
  description: ReactNode;
}

/* Three of the Gateway sections are the same shape — a heading, an optional
   lead, a list of term/description rows, and sometimes a closing line. They
   share this component rather than three near-identical files, so a change to
   the row rhythm lands in one place. */
export function ListSection({
  id,
  title,
  lead,
  items,
  closer,
  tight = false,
}: {
  id: string;
  title: string;
  lead?: ReactNode;
  items: ListSectionItem[];
  closer?: ReactNode;
  tight?: boolean;
}) {
  return (
    <section
      className={`${styles.section} ${tight ? styles.sectionTight : ""}`}
      aria-labelledby={id}
    >
      <h2 id={id} className={styles.heading}>
        {title}
      </h2>
      {lead ? <p className={styles.lead}>{lead}</p> : null}

      <ul className={styles.rows}>
        {items.map((item) => (
          <li className={styles.row} key={item.term}>
            <span className={styles.term}>{item.term}</span>
            <p className={styles.desc}>{item.description}</p>
          </li>
        ))}
      </ul>

      {closer ? <p className={styles.closer}>{closer}</p> : null}
    </section>
  );
}
