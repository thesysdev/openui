import { z } from "zod/v4";
import { children } from "../style";

export const GSchema = z.object({ children, transform: z.string().optional(), opacity: z.number().optional() });

export type GProps = z.infer<typeof GSchema>;
