"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ok, paint, paintAttrs, POINTS } from "./helpers";
import { Standalone } from "./standalone";

export const PolygonSchema = z.object({ points: z.string(), ...paint });

export const Polygon = defineComponent({
  name: "Polygon",
  props: PolygonSchema,
  description: "",
  component: ({ props }) => (
    <Standalone>
      <polygon points={ok(props.points, POINTS)} {...paintAttrs(props, true)} />
    </Standalone>
  ),
});
