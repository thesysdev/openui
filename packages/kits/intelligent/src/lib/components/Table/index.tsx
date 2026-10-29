"use client";

import {
  Table as RCTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@openuidev/react-components";
import { defineComponent } from "@openuidev/react-lang";
import { inline } from "../markdownBlocks";
import { isElement } from "../style";
import { TableSchema } from "./schema";

export * from "./schema";

const NUMERIC = /^[-+−]?[$€£¥₹]?\s?\d[\d,]*(\.\d+)?\s?(%|[kKmMbB]|bn)?$/;
export const Table = defineComponent({
  name: "Table",
  props: TableSchema,
  description:
    "Each row lists its cells in column order; a cell may be a component. Number columns align right.",
  component: ({ props, renderNode }) => {
    const columns = Array.isArray(props.columns) ? props.columns.map((c) => String(c ?? "")) : [];
    const rows = (Array.isArray(props.rows) ? props.rows : []).filter(Array.isArray) as unknown[][];

    // A column of numbers (or amounts like "$1.2k" and "45%") aligns right.
    // Kept from the kit's own Table: react-components has the align prop but
    // not the detection, and the schema promises this behaviour.
    const numeric = columns.map((_, c) => {
      const cells = rows
        .map((r) => r[c])
        .filter((v) => v != null && v !== "" && !(typeof v === "string" && /^(n\/a|—|–|-)$/i.test(v.trim())));
      return cells.length > 0 && cells.every((v) => typeof v === "number" || (typeof v === "string" && NUMERIC.test(v.trim())));
    });

    // A cell may be a component, a number, or markdown-bearing text.
    const cell = (value: unknown) =>
      isElement(value)
        ? renderNode(value)
        : typeof value === "number"
          ? value.toLocaleString("en-US", { maximumFractionDigits: 2 })
          : inline(String(value ?? ""));

    return (
      <RCTable>
        <TableHeader>
          <TableRow>
            {columns.map((c, i) => (
              <TableHead key={i} align={numeric[i] ? "right" : "left"}>
                {c}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, r) => (
            <TableRow key={r}>
              {columns.map((_, c) => (
                <TableCell key={c} align={numeric[c] ? "right" : "left"}>
                  {cell(row[c])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </RCTable>
    );
  },
});
