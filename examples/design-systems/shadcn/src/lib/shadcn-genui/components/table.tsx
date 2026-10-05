"use client";

import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const ColSchema = z.object({
  header: z.string(),
  type: z.enum(["string", "number", "boolean"]).optional(),
});

export const Col = defineComponent({
  name: "Col",
  props: ColSchema,
  description: "Column definition for Table — header label and optional type.",
  component: () => null,
});

const TableSchema = z.object({
  columns: z.array(Col.ref),
  rows: z.array(z.array(z.any())),
});

export const Table = defineComponent({
  name: "Table",
  props: TableSchema,
  description: "Data table. columns: Col[] with header/type, rows: 2D array of values.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns = ((props.columns ?? []) as any[]).map((c) => ({
      header: String(c?.props?.header ?? ""),
      type: c?.props?.type ?? "string",
    }));
    const rows = (props.rows ?? []) as unknown[][];

    return (
      <div className="rounded-md border">
        <ShadcnTable>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className={col.type === "number" ? "text-right" : ""}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, ri) => (
              <TableRow key={ri}>
                {columns.map((col, ci) => (
                  <TableCell
                    key={ci}
                    className={col.type === "number" ? "text-right tabular-nums" : ""}
                  >
                    {String(row[ci] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </ShadcnTable>
      </div>
    );
  },
});
