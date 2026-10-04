import { z } from "zod/v4";

export const selectItemPropsSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export type SelectItemProps = z.infer<typeof selectItemPropsSchema>;
