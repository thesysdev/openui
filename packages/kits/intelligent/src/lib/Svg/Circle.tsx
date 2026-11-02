"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { n, paint, paintAttrs } from "./helpers";
import { Standalone } from "./standalone";

export const CircleSchema = z.object({ cx: z.number(), cy: z.number(), r: z.number(), ...paint });

export const Circle = defineComponent({
  name: "Circle",
  props: CircleSchema,
  description: "fill defaults to the text color; with only a stroke it stays unfilled.",
  component: ({ props }) => (
    <Standalone>
      <circle
        cx={n(props.cx)}
        cy={n(props.cy)}
        r={Math.max(0, n(props.r) ?? 0)}
        {...paintAttrs(props, true)}
      />
    </Standalone>
  ),
});
