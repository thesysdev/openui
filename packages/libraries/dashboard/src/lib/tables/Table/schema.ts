import { z } from "zod/v4";
import { ColumnComponent } from "../Column";

export const tablePropsSchema = z.object({
  columns: z.array(ColumnComponent.ref),
  pageSize: z.number().optional(),
  totals: z.boolean().optional(),
  search: z.string().optional(),
  groupBy: z.string().optional(),
});

export type TableSchemaProps = z.infer<typeof tablePropsSchema>;
