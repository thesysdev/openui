import { z } from "zod/v4";
import { CardRowComponent } from "../CardRow";
import { FilterBarComponent } from "../FilterBar";
export const sectionPropsSchema = z.object({
  rows: z.array(CardRowComponent.ref).min(1),
  filterBar: z.optional(FilterBarComponent.ref),
});

export type SectionProps = z.infer<typeof sectionPropsSchema>;
