"use client";

import { defineComponent } from "@openuidev/react-lang";
import { n, paintAttrs } from "../svgHelpers";
import { LineSchema } from "./schema";

export * from "./schema";

export const Line = defineComponent({
  name: "Line",
  props: LineSchema,
  description: "",
  component: ({ props }) => <line x1={n(props.x1)} y1={n(props.y1)} x2={n(props.x2)} y2={n(props.y2)} {...paintAttrs(props, false)} />,
});
