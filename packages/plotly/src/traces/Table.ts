"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const TableSchema = z.object({
  headers: z.array(z.string()),
  values: z.array(z.array(z.union([z.string(), z.number()]))),
  align: z.enum(["left", "center", "right"]).optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

// Defensive normalization — the LLM frequently emits Tables where:
//   • the number of value columns < the number of headers, or
//   • columns have different lengths.
// Rather than rendering empty space, pad to a consistent rectangle and use
// "—" for cells the model never filled in. This makes incomplete data
// visibly incomplete instead of looking like an empty table.
function normalize(
  headers: string[],
  values: Array<Array<string | number>>,
): Array<Array<string | number>> {
  const numCols = headers.length;
  const cols = Array.from({ length: numCols }, (_, i) => values[i] ?? []);
  const rowCount = Math.max(0, ...cols.map((c) => c.length));
  return cols.map((c) => {
    if (c.length === rowCount) return c;
    return [...c, ...Array(rowCount - c.length).fill("—")];
  });
}

export const Table = defineComponent({
  name: "Table",
  props: TableSchema,
  description:
    "Plotly table — COLUMN-oriented. `headers` is the list of column titles. `values` is an array of columns, where each column is an array of cells (e.g. `Table(['Name','Age'], [['Alice','Bob'], [30, 25]])`). Pass ALL columns matching headers length — short or missing columns are padded with '—' so missing data is visible.",
  component: ({ props }) => {
    const headers = props.headers ?? [];
    if (headers.length === 0) return null;
    const cols = normalize(headers, props.values ?? []);
    const trace = {
      type: "table",
      header: {
        values: headers,
        align: props.align ?? "left",
        fill: { color: "rgba(15,23,42,0.04)" },
        font: { size: 11, color: "rgba(15,23,42,0.85)" },
        line: { color: "rgba(15,23,42,0.10)" },
      },
      cells: {
        values: cols,
        align: props.align ?? "left",
        font: { size: 12, color: "#0f172a" },
        line: { color: "rgba(15,23,42,0.06)" },
        height: 28,
      },
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      margin: { t: props.title ? 32 : 4, l: 4, r: 4, b: 4 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
