import { z } from "zod/v4";
import { oneOf, refs, SECTION_ROWS } from "../../slots";
import { RowComponent } from "../Row";

export const sectionPropsSchema = z.object({
  title: z.string(),
  rows: z.array(oneOf([...refs(SECTION_ROWS), RowComponent.ref as z.ZodType])),
  description: z.string().optional(),
});
export type SectionSchemaProps = z.infer<typeof sectionPropsSchema>;
