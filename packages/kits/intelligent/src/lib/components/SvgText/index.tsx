"use client";

import { defineComponent } from "@openuidev/react-lang";
import { fg } from "../style";
import { n } from "../svgHelpers";
import { SvgTextSchema } from "./schema";

export * from "./schema";

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
