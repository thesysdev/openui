import FoundationTable from "@components/components/preview/FoundationTable";
import type { ColorTokenItem, TableColumn } from "@components/types";
import styles from "./FoundationTokenTable.module.css";

const columns: TableColumn[] = [
  { key: "token", label: "Color token" },
  { key: "useCase", label: "Use case" },
  { key: "className", label: "Class name" },
];

const toDisplayName = (token = ""): string =>
  token
    .replace(/^--/, "")
    .replace(/^openui-/, "")
    .replace(/^(openui|text|interactive|border)-/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

interface ColorTokenTableProps {
  items: ColorTokenItem[];
}

export default function ColorTokenTable({ items = [] }: ColorTokenTableProps) {
  return (
    <FoundationTable columns={columns}>
      {items.map((item) => (
        <tr key={item.token} className={styles.foundationTableBodyRow}>
          <td className={styles.foundationTableCell}>
            <div className={styles.foundationTokenCell}>
              <span
                className={styles.foundationColorDot}
                style={{ backgroundColor: `var(${item.token})` }}
              />
              <span>{item.label ?? toDisplayName(item.token)}</span>
            </div>
          </td>
          <td className={styles.foundationTableCell}>{item.useCase}</td>
          <td className={styles.foundationTableCell}>
            <code className={styles.foundationTokenName}>{item.className ?? item.token}</code>
          </td>
        </tr>
      ))}
    </FoundationTable>
  );
}
