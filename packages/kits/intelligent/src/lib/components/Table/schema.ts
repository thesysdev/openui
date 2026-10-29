import { z } from "zod/v4";

export const TableSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.array(z.any())),
});

export type TableProps = z.infer<typeof TableSchema>;
