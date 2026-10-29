"use client";

import { defineComponent } from "@openuidev/react-lang";
import { ok, paintAttrs, POINTS } from "../svgHelpers";
import { PolylineSchema } from "./schema";

export * from "./schema";

export const Polyline = defineComponent({
  name: "Polyline",
  props: PolylineSchema,
  description: 'points like "0,0 10,5 20,0".',
  component: ({ props }) => <polyline points={ok(props.points, POINTS)} {...paintAttrs(props, false)} />,
});
