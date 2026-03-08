import FoundationTable from "@components/components/preview/FoundationTable";
import type { TableColumn, TypographyPreviewItem } from "@components/types";
import styles from "./FoundationTokenTable.module.css";

const columns: TableColumn[] = [
  { key: "preview", label: "Aa Example" },
  { key: "className", label: "Class name" },
];

interface TypographyTokenTableProps {
  items: TypographyPreviewItem[];
}

export default function TypographyTokenTable({ items = [] }: TypographyTokenTableProps) {
  return (
    <FoundationTable
      columns={columns}
      colgroup={
        <colgroup>
          <col className={styles.typographyExampleCol} />
          <col className={styles.typographyClassCol} />
        </colgroup>
      }
    >
      {items.map((item) => (
        <tr key={item.token} className={styles.foundationTableBodyRow}>
          <td className={styles.foundationTableCell}>
            <p className={styles.typographyTokenPreview} style={item.style}>
              {item.preview}
            </p>
          </td>
          <td className={styles.foundationTableCell}>
            <code className={styles.foundationTokenName}>{item.className ?? item.token}</code>
          </td>
        </tr>
      ))}
    </FoundationTable>
  );
}
