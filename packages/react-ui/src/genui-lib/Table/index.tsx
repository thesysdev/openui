"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
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

export const Col = defineComponent({
  name: "Col",
  props: ColSchema,
  description: "Column definition",
  component: () => null,
});

export const Table = defineComponent({
  name: "Table",
  props: z.object({
    columns: z.array(Col.ref),
    rows: z.array(z.array(z.union([z.string(), z.number(), z.boolean()]))),
  }),
  description: "Data table",
  component: ({ props, renderNode }) => {
    const columns = props.columns ?? [];
    const rows = asArray(props.rows) as unknown[][];

    if (!columns.length) return null;

    return (
      <OpenUITable>
        <OpenUITableHeader>
          <OpenUITableRow>
            {columns.map((c, i) => (
              <OpenUITableHead key={i}>{c.props.label}</OpenUITableHead>
            ))}
          </OpenUITableRow>
        </OpenUITableHeader>
        <OpenUITableBody>
          {rows.map((row, ri) => {
            const cells = asArray(row);
            return (
              <OpenUITableRow key={ri}>
                {cells.map((cell, ci) => (
                  <OpenUITableCell key={ci}>
                    {typeof cell === "object" && cell !== null
                      ? renderNode(cell)
                      : String(cell ?? "")}
                  </OpenUITableCell>
                ))}
              </OpenUITableRow>
            );
          })}
        </OpenUITableBody>
      </OpenUITable>
    );
  },
});
