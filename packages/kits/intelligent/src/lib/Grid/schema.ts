import { z } from "zod/v4";
import { children } from "../helpers";

export const GridSchema = z.object({
  children,
  columns: z.number().optional(),
  minChildWidth: z.number().optional(),
  gap: z.number().optional(),
});

export type GridProps = z.infer<typeof GridSchema>;
