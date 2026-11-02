"use client";

import {
  IconButton,
  ScrollableTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from "@openuidev/react-components";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { names, styles } from "./table.styles";

const DEFAULT_PAGE_SIZE = 10;

export interface TableColumn {
  label: string;
  cells: ReactNode[];
}

export interface TableProps {
  columns: TableColumn[];
  loading?: boolean;
}

/** Column-oriented table on react-components' primitives, paginated at 10 rows. */
export function Table({ columns, loading }: TableProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const rowCount = columns.length > 0 ? Math.max(...columns.map((c) => c.cells.length), 0) : 0;

  if (loading && rowCount === 0) {
    return <TableSkeleton rows={5} columns={Math.max(columns.length, 3)} />;
  }

  if (!columns.length) return null;

  const totalPages = Math.ceil(rowCount / DEFAULT_PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(0, totalPages - 1));
  const startRow = safePage * DEFAULT_PAGE_SIZE;
  const endRow = Math.min(startRow + DEFAULT_PAGE_SIZE, rowCount);

  return (
    <div className={clsx(styles.root, names.root)}>
      <ScrollableTable>
        <TableHeader>
          <TableRow>
            {columns.map((c, i) => (
              <TableHead key={i}>{c.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: endRow - startRow }, (_, i) => {
            const rowIndex = startRow + i;
            return (
              <TableRow key={rowIndex}>
                {columns.map((column, columnIndex) => (
                  <TableCell key={columnIndex}>{column.cells[rowIndex] ?? ""}</TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </ScrollableTable>
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "8px",
            paddingTop: "8px",
          }}
        >
          <IconButton
            aria-label="Previous page"
            size="small"
            variant="secondary"
            icon={<ChevronLeft size={16} />}
            disabled={safePage === 0}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          />
          <span style={{ fontSize: "13px", color: "#6b7280" }}>
            {safePage + 1} / {totalPages}
          </span>
          <IconButton
            aria-label="Next page"
            size="small"
            variant="secondary"
            icon={<ChevronRight size={16} />}
            disabled={safePage >= totalPages - 1}
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
          />
        </div>
      )}
    </div>
  );
}
