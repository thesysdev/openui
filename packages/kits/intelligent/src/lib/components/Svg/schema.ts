import { z } from "zod/v4";
import { children, length } from "../style";

export const SvgSchema = z.object({
  children,
  viewBox: z.string(),
  width: length.optional(),
  height: length.optional(),
});

export type SvgProps = z.infer<typeof SvgSchema>;
