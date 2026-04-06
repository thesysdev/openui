"use client";

import { defineComponent } from "@openuidev/react-lang";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { z } from "zod";
import { IconButton } from "../../components/IconButton";
import {
  ScrollableTable as OpenUITable,
  TableBody as OpenUITableBody,
  TableCell as OpenUITableCell,
  TableHead as OpenUITableHead,
  TableHeader as OpenUITableHeader,
  TableRow as OpenUITableRow,
} from "../../components/Table";
import { asArray } from "../helpers";
import { ColSchema } from "./schema";

export { ColSchema } from "./schema";

const DEFAULT_PAGE_SIZE = 10;

export const Col = defineComponent({
  name: "Col",
  props: ColSchema,
  description: "Column definition — holds label + data array",
  component: () => null,
});

export const Table = defineComponent({
  name: "Table",
  props: z.object({
    columns: z.array(Col.ref),
  }),
  description: "Data table — column-oriented. Each Col holds its own data array.",
  component: ({ props, renderNode }) => {
    const effectivePageSize = DEFAULT_PAGE_SIZE;

    const [currentPage, setCurrentPage] = React.useState(0);

    const columns = props.columns ?? [];
    if (!columns.length) return null;

    const colDefs = columns
      .filter((c: any) => c != null && c.props)
      .map((c: any) => ({
        label: c.props?.label ?? "",
        data: asArray(c.props?.data ?? []),
      }));
    if (!colDefs.length) return null;

    const rowCount = Math.max(...colDefs.map((c) => c.data.length), 0);

    const totalPages = Math.ceil(rowCount / effectivePageSize);
    const safePage = Math.min(currentPage, Math.max(0, totalPages - 1));
    const startRow = safePage * effectivePageSize;
    const endRow = Math.min(startRow + effectivePageSize, rowCount);
    const visibleRowCount = endRow - startRow;

    return (
      <div>
        <OpenUITable>
          <OpenUITableHeader>
            <OpenUITableRow>
              {colDefs.map((c, i) => (
                <OpenUITableHead key={i}>{c.label}</OpenUITableHead>
              ))}
            </OpenUITableRow>
          </OpenUITableHeader>
          <OpenUITableBody>
            {Array.from({ length: visibleRowCount }, (_, i) => {
              const ri = startRow + i;
              return (
                <OpenUITableRow key={ri}>
                  {colDefs.map((col, ci) => {
                    const cell = col.data[ri];
                    return (
                      <OpenUITableCell key={ci}>
                        {typeof cell === "object" && cell !== null
                          ? renderNode(cell)
                          : String(cell ?? "")}
                      </OpenUITableCell>
                    );
                  })}
                </OpenUITableRow>
              );
            })}
          </OpenUITableBody>
        </OpenUITable>
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
  },
});
