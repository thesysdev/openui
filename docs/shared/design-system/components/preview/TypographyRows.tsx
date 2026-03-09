import type { TypographyRow } from "@design-system/types";
import type { CSSProperties } from "react";
import styles from "./PreviewLayout.module.css";

interface TypographyRowsProps {
  rows: TypographyRow[];
  getStyle: (token: string) => CSSProperties;
}

export default function TypographyRows({ rows, getStyle }: TypographyRowsProps) {
  return (
    <div className={styles.typographyRows}>
      {rows.map((row) => (
        <article key={row.key ?? `${row.token}-${row.sample}`} className={styles.typographyRow}>
          <code className={styles.typographyVariable}>{row.token}</code>
          <p className={styles.typographySample} style={getStyle(row.token)}>
            {row.sample}
          </p>
        </article>
      ))}
    </div>
  );
}
