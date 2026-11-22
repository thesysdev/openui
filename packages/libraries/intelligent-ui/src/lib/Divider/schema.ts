import { z } from "zod/v4";

export const DividerSchema = z.object({});

export type DividerProps = z.infer<typeof DividerSchema>;
