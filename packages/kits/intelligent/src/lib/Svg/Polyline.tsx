"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ok, paintAttrs, POINTS } from "./helpers";
import { color } from "../helpers";

export const PolylineSchema = z.object({ points: z.string(), stroke: color.optional(), strokeWidth: z.number().optional(), fill: color.optional(), opacity: z.number().optional() });

export const Polyline = defineComponent({
  name: "Polyline",
  props: PolylineSchema,
  description: 'points like "0,0 10,5 20,0".',
  component: ({ props }) => <polyline points={ok(props.points, POINTS)} {...paintAttrs(props, false)} />,
});
