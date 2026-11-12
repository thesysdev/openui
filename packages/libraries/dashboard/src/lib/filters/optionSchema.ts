import { z } from "zod/v4";
export const optionSchema = z.object({ value: z.string(), label: z.string().optional() });
