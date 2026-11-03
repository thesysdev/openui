import { z } from "zod/v4";

export const CelebrationSchema = z.object({ when: z.boolean() });

export type CelebrationProps = z.infer<typeof CelebrationSchema>;
