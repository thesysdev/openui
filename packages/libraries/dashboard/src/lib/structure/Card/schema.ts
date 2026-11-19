import { z } from "zod/v4";
import { widthSchema } from "../../../shared/schema";
import { CARD_CONTENT, CARD_CONTROLS, oneOf, refs } from "../../slots";

export const cardPropsSchema = z.object({
  title: z.string(),
  content: z.array(oneOf(refs(CARD_CONTENT))),
  width: widthSchema.optional(),
  subtitle: z.string().optional(),
  controls: z.array(oneOf(refs(CARD_CONTROLS))).optional(),
});
export type CardSchemaProps = z.infer<typeof cardPropsSchema>;
