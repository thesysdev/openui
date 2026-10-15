import { z } from "zod/v4";
import { Icon } from "../Icon";
import { SelectItem } from "../Select";

/** One editable column: its key, header label, cell editor and optional leading icon. */
export const EditableColSchema = z.object({
  /** Field key the column's values are submitted under */
  key: z.string(),
  /** Header label */
  label: z.string(),
  /** Cell editor; also picks the default header icon */
  type: z.enum(["text", "number", "date", "select", "url"]).default("text"),
  /** Choices for a `select` column */
  options: z.array(SelectItem.ref).optional(),
  /** Leading header icon; defaults to one for the column type */
  icon: z.optional(Icon.ref),
  /** Minimum column width in px */
  width: z.number().optional(),
});

export function createEditableTableSchema(EditableCol: { ref: any }) {
  return z.object({
    /** Unique name of the table; used as the form field name for the edited data */
    name: z.string().default(""),
    columns: z.array(EditableCol.ref).default([]),
    /** Rows of cell values, ordered positionally to match `columns` */
    rows: z.array(z.array(z.union([z.string(), z.number(), z.null()]))).default([]),
  });
}

export type EditableColProps = z.infer<typeof EditableColSchema>;
export type EditableTableDataRow = { id: string; values: (string | number | null)[] };
export type EditableTableData = EditableTableDataRow[];
