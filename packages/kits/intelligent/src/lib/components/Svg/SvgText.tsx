"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { color, fg } from "../style";
import { n } from "./helpers";

export const SvgTextSchema = z.object({
  text: z.string(),
  x: z.number(),
  y: z.number(),
  size: z.number().optional(),
  fill: color.optional(),
  anchor: z.enum(["start", "middle", "end"]).optional(),
  weight: z.enum(["normal", "medium", "semibold"]).optional(),
});

export const SvgText = defineComponent({
  name: "SvgText",
  props: SvgTextSchema,
  description: "",
  component: ({ props }) => (
    <text
      x={n(props.x)}
      y={n(props.y)}
      fontSize={n(props.size) ?? 12}
      fill={fg(props.fill) ?? "currentColor"}
      textAnchor={props.anchor ?? "start"}
      fontWeight={props.weight === "semibold" ? 640 : props.weight === "medium" ? 560 : 440}
      fontFamily="var(--iui-font)"
    >
      {String(props.text ?? "")}
    </text>
  ),
});
