import { z } from "zod/v4";
import { stackedSchema } from "../../../shared/chartHelpers";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema } from "../../../shared/schema";
import { MarkerComponent as Marker } from "../Marker";
import { ReferenceComponent as Reference } from "../Reference";
import { SeriesComponent as Series } from "../Series";

export const timeSeriesPropsSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(Series.ref),
  type: z.enum(["line", "area", "bar"]).optional(),
  format: formatSchema.optional(),
  stacked: stackedSchema.optional(),
  references: z.array(Reference.ref).optional(),
  goodWhen: goodWhenSchema.optional(),
  markers: z.array(Marker.ref).optional(),
  curve: z.enum(["smooth", "linear", "step"]).optional(),
  forecastFrom: z.string().optional(),
});
export type TimeSeriesSchemaProps = z.infer<typeof timeSeriesPropsSchema>;
