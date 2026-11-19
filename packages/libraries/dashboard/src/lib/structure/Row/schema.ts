import { z } from "zod/v4";
import { CardComponent } from "../Card";

export const rowPropsSchema = z.object({
  items: z.array(CardComponent.ref),
  height: z
    .union([
      z.literal(240),
      z.literal(320),
      z.literal(400),
      z.literal(480),
      z.literal(560),
      z.literal(640),
    ])
    .optional(),
});
export type RowSchemaProps = z.infer<typeof rowPropsSchema>;
