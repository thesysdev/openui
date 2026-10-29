"use client";

import { defineComponent } from "@openuidev/react-lang";
import { n, paintAttrs } from "../svgHelpers";
import { CircleSchema } from "./schema";

export * from "./schema";

export const Circle = defineComponent({
  name: "Circle",
  props: CircleSchema,
  description: "",
  component: ({ props }) => <circle cx={n(props.cx)} cy={n(props.cy)} r={Math.max(0, n(props.r) ?? 0)} {...paintAttrs(props, true)} />,
});
