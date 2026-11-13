import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const searchFilterPropsSchema = z.object({
  value: reactive(z.string()),
  placeholder: z.string().optional(),
});
export type SearchFilterSchemaProps = z.infer<typeof searchFilterPropsSchema>;
