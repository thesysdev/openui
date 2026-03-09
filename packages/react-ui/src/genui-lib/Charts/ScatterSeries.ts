import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { PointSchema } from "./Point";

export const ScatterSeriesSchema = z.object({
  name: z.string(),
  points: z.array(PointSchema),
});

export const ScatterSeries = defineComponent({
  name: "ScatterSeries",
  props: ScatterSeriesSchema,
  description: "Named dataset",
  component: () => null,
});
