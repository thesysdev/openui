import { z } from "zod/v4";

export const EditableTableSchema = z.object({
  /** Unique name of the table; used as the form field name for the edited data */
  name: z.string().default(""),
  /** Column definitions; `options` is only used by `select` columns */
  columns: z
    .array(
      z.object({
        type: z.enum(["text", "number", "date-single", "select", "url"]),
        key: z.string().default("default"),
        header: z.string().default(""),
        width: z.number().optional(),
        options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
      }),
    )
    .default([]),
  /** Rows; `values` are ordered positionally to match `columns` */
  data: z
    .array(
      z.object({
        id: z.string(),
        values: z.array(z.union([z.string(), z.number()])),
      }),
    )
    .default([]),
});

export type EditableTableProps = z.infer<typeof EditableTableSchema>;
export type EditableTableDataRow = { id: string; values: (string | number)[] };
export type EditableTableData = EditableTableDataRow[];
