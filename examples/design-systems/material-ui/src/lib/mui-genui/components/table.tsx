"use client";

import Paper from "@mui/material/Paper";
import MuiTable from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
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
    const columns = ((props.columns ?? []) as unknown[]).map((c) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const col = c as any;
      return {
        header: String(col?.props?.header ?? ""),
        type: (col?.props?.type ?? "string") as string,
      };
    });
    const rows = (props.rows ?? []) as unknown[][];

    return (
      <TableContainer component={Paper} variant="outlined">
        <MuiTable size="small">
          <TableHead>
            <TableRow>
              {columns.map((col, i) => (
                <TableCell key={i} align={col.type === "number" ? "right" : "left"}>
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, ri) => (
              <TableRow key={ri}>
                {columns.map((col, ci) => (
                  <TableCell key={ci} align={col.type === "number" ? "right" : "left"}>
                    {String(row[ci] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </MuiTable>
      </TableContainer>
    );
  },
});
