"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { color } from "../style";
import { n, paintAttrs } from "./helpers";

export const LineSchema = z.object({ x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number(), stroke: color.optional(), strokeWidth: z.number().optional(), opacity: z.number().optional() });

export const Line = defineComponent({
  name: "Line",
  props: LineSchema,
  description: "",
  component: ({ props }) => <line x1={n(props.x1)} y1={n(props.y1)} x2={n(props.x2)} y2={n(props.y2)} {...paintAttrs(props, false)} />,
});
