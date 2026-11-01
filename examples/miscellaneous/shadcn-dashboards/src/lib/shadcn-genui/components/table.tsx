"use client";

import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { defineComponent } from "@openuidev/react-lang";
import type { ReactNode } from "react";
import { z } from "zod";
import { asArray, formatDate, formatNumber, isDateLike, isElement } from "../format";

const ColType = z.enum(["text", "number", "compact", "percent", "date"]);

export const Col = defineComponent({
  name: "Col",
  props: z.object({
    header: z.string(),
    data: z.array(z.any()),
    type: ColType.optional(),
  }),
  description:
    'One table column: its header and its values, top to bottom. Pluck values from a Query: Col("Version", pkg.releases.version). Values can also be components, such as Tag, built with @Each. type formats values: "number", "compact" (1.2M), "percent", or "date".',
  component: () => null,
});

export const Table = defineComponent({
  name: "Table",
  props: z.object({
    columns: z.array(Col.ref),
    limit: z.number().optional(),
  }),
  description:
    "Column-oriented data table: Table([Col(...), Col(...)]). Rows line up by position. limit caps the rows shown.",
  component: ({ props, renderNode }) => {
    const columns = asArray(props.columns)
      .filter(isElement)
      .map((col) => ({
        header: String(col.props.header ?? ""),
        type: (col.props.type as z.infer<typeof ColType> | undefined) ?? "text",
        data: asArray(col.props.data),
      }));
    if (!columns.length) return null;
    const total = Math.max(0, ...columns.map((col) => col.data.length));
    const count = typeof props.limit === "number" ? Math.min(total, props.limit) : total;
    const numeric = (type: string) => type !== "text" && type !== "date";

    const cell = (value: unknown, type: z.infer<typeof ColType>): ReactNode => {
      if (value == null || value === "") return <span className="text-muted-foreground">–</span>;
      if (isElement(value) || Array.isArray(value)) return renderNode(value);
      if (typeof value === "number" && type !== "text" && type !== "date")
        return formatNumber(
          value,
          type === "compact" ? "compact" : type === "percent" ? "percent" : "number",
        );
      if (typeof value === "number") return formatNumber(value);
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if ((type === "date" || type === "text") && isDateLike(value)) return formatDate(value);
      return String(value);
    };

    if (count === 0)
      return <p className="py-6 text-center text-sm text-muted-foreground">No rows to show.</p>;

    return (
      <div className="overflow-hidden rounded-lg border">
        <ShadcnTable>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((col, index) => (
                <TableHead key={index} className={cn(numeric(col.type) && "text-right")}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: count }, (_, row) => (
              <TableRow key={row}>
                {columns.map((col, index) => (
                  <TableCell
                    key={index}
                    className={cn(
                      "max-w-[28rem] truncate",
                      numeric(col.type) && "text-right tabular-nums",
                    )}
                  >
                    {cell(col.data[row], col.type)}
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
