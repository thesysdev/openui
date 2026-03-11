import type { FoundationTokenItem } from "@components/types";
import type { ReactNode } from "react";
import styles from "./PreviewLayout.module.css";

interface TokenRowsProps {
  items: FoundationTokenItem[];
  renderPreview: (item: FoundationTokenItem) => ReactNode;
}

export default function TokenRows({ items, renderPreview }: TokenRowsProps) {
  return (
    <div className={styles.tokenRows}>
      {items.map((item) => (
        <article key={item.key ?? item.token} className={styles.tokenRow}>
          <code className={styles.tokenName}>{item.token}</code>
          <code className={styles.tokenValue}>{item.value ?? "..."}</code>
          <div className={styles.tokenPreview}>{renderPreview(item)}</div>
        </article>
      ))}
    </div>
  );
}
