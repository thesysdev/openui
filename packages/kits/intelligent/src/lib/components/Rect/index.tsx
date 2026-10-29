"use client";

import { defineComponent } from "@openuidev/react-lang";
import { n, paintAttrs } from "../svgHelpers";
import { RectSchema } from "./schema";

export * from "./schema";

export const Rect = defineComponent({
  name: "Rect",
  props: RectSchema,
  description: "",
  component: ({ props }) => (
    <rect x={n(props.x)} y={n(props.y)} width={Math.max(0, n(props.width) ?? 0)} height={Math.max(0, n(props.height) ?? 0)} rx={n(props.rx)} {...paintAttrs(props, true)} />
  ),
});
