"use client";

import { defineComponent } from "@openuidev/react-lang";
import { ok, paintAttrs, POINTS } from "../svgHelpers";
import { PolygonSchema } from "./schema";

export * from "./schema";

export const Polygon = defineComponent({
  name: "Polygon",
  props: PolygonSchema,
  description: "",
  component: ({ props }) => <polygon points={ok(props.points, POINTS)} {...paintAttrs(props, true)} />,
});
