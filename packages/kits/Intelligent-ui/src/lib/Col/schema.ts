import { z } from "zod/v4";
import { align, children } from "../helpers";

export const ColSchema = z.object({ children, gap: z.number().optional(), align: align.optional() });

export type ColProps = z.infer<typeof ColSchema>;
