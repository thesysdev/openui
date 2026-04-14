import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
});

export const Point = defineComponent({
  name: "Point",
  props: PointSchema,
  description: "Data point with numeric coordinates",
  component: () => null,
});
