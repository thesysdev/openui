import { z } from "zod/v4";
export const smallCardPropsSchema = z.object({
  top: z.any(),
  bottom: z.any().optional(),
  trend: z.any().optional(),
});

export type SmallCardProps = z.infer<typeof smallCardPropsSchema>;
