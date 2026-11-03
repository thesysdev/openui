import { z } from "zod/v4";

export const SpacerSchema = z.object({});

export type SpacerProps = z.infer<typeof SpacerSchema>;
