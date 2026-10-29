"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { n, paint, paintAttrs } from "./helpers";

export const CircleSchema = z.object({ cx: z.number(), cy: z.number(), r: z.number(), ...paint });

export const Circle = defineComponent({
  name: "Circle",
  props: CircleSchema,
  description: "",
  component: ({ props }) => <circle cx={n(props.cx)} cy={n(props.cy)} r={Math.max(0, n(props.r) ?? 0)} {...paintAttrs(props, true)} />,
});
