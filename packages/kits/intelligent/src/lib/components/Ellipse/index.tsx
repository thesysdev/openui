"use client";

import { defineComponent } from "@openuidev/react-lang";
import { n, paintAttrs } from "../svgHelpers";
import { EllipseSchema } from "./schema";

export * from "./schema";

export const Ellipse = defineComponent({
  name: "Ellipse",
  props: EllipseSchema,
  description: "",
  component: ({ props }) => <ellipse cx={n(props.cx)} cy={n(props.cy)} rx={Math.max(0, n(props.rx) ?? 0)} ry={Math.max(0, n(props.ry) ?? 0)} {...paintAttrs(props, true)} />,
});
