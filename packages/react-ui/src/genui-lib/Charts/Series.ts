import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const SeriesSchema = z.object({
  category: z.string(),
  values: z.array(z.number()),
});

export const Series = defineComponent({
  name: "Series",
  props: SeriesSchema,
  description: "One data series",
  component: () => null,
});
