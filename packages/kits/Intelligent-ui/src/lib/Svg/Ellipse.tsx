"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { n, paint, paintAttrs } from "./helpers";

export const EllipseSchema = z.object({ cx: z.number(), cy: z.number(), rx: z.number(), ry: z.number(), ...paint });

export const Ellipse = defineComponent({
  name: "Ellipse",
  props: EllipseSchema,
  description: "",
  component: ({ props }) => <ellipse cx={n(props.cx)} cy={n(props.cy)} rx={Math.max(0, n(props.rx) ?? 0)} ry={Math.max(0, n(props.ry) ?? 0)} {...paintAttrs(props, true)} />,
});
