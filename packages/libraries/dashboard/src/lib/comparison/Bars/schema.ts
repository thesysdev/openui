import { z } from "zod/v4";
import { stackedSchema } from "../../../shared/chartHelpers";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema } from "../../../shared/schema";
import { ReferenceComponent } from "../../trends/Reference";
import { SeriesComponent } from "../../trends/Series";

// Series and Reference belong to the Trends group (#221): Bars takes the registered ones, so the
// parser and prompt know them by name.

export const barsPropsSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesComponent.ref),
  format: formatSchema.optional(),
  orientation: z.enum(["vertical", "horizontal"]).optional(),
  stacked: stackedSchema.optional(),
  goodWhen: goodWhenSchema.optional(),
  references: z.array(ReferenceComponent.ref).optional(),
  diverging: z.array(z.string()).optional(),
});
export type BarsSchemaProps = z.infer<typeof barsPropsSchema>;
