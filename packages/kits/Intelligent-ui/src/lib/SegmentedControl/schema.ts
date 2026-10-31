import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { options } from "../controlHelpers";

export const SegmentedControlSchema = z.object({
  value: reactive(z.string()),
  options,
  block: z.boolean().optional(),
});

export type SegmentedControlProps = z.infer<typeof SegmentedControlSchema>;
