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
    const columns = props.columns ?? [];
    if (!columns.length) return null;

    // Extract column data arrays and labels (filter null children from streaming)
    const colDefs = columns
      .filter((c: any) => c != null && c.props)
      .map((c: any) => ({
        label: c.props?.label ?? "",
        data: asArray(c.props?.data ?? []),
      }));
    if (!colDefs.length) return null;

    // Transpose columns → rows: row count = max column length
    const rowCount = Math.max(...colDefs.map((c) => c.data.length), 0);

    return (
      <OpenUITable>
        <OpenUITableHeader>
          <OpenUITableRow>
            {colDefs.map((c, i) => (
              <OpenUITableHead key={i}>{c.label}</OpenUITableHead>
            ))}
          </OpenUITableRow>
        </OpenUITableHeader>
        <OpenUITableBody>
          {Array.from({ length: rowCount }, (_, ri) => (
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
          ))}
        </OpenUITableBody>
      </OpenUITable>
    );
  },
});
