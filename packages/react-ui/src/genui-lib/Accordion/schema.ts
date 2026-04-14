import { z } from "zod/v4";
import { ContentChildUnion } from "../unions";

export const AccordionItemSchema = z.object({
  value: z.string(),
  trigger: z.string(),
  content: z.array(ContentChildUnion),
});
