"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { n, paint, paintAttrs } from "./helpers";

export const RectSchema = z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number(), ...paint, rx: z.number().optional() });

export const Rect = defineComponent({
  name: "Rect",
  props: RectSchema,
  description: "",
  component: ({ props }) => (
    <rect x={n(props.x)} y={n(props.y)} width={Math.max(0, n(props.width) ?? 0)} height={Math.max(0, n(props.height) ?? 0)} rx={n(props.rx)} {...paintAttrs(props, true)} />
  ),
});
