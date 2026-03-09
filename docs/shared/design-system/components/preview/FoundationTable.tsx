import type { TableColumn } from "@design-system/types";
import type { ReactNode } from "react";
import styles from "./FoundationTokenTable.module.css";

interface FoundationTableProps {
  columns: TableColumn[];
  colgroup?: ReactNode;
  children: ReactNode;
}

export default function FoundationTable({ columns, colgroup, children }: FoundationTableProps) {
  return (
    <table className={styles.foundationTable}>
      {colgroup}
      <thead>
        <tr className={styles.foundationTableHeadRow}>
          {columns.map((column) => (
            <th key={column.key} className={styles.foundationTableHeaderCell} scope="col">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
