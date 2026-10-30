"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Svg as SvgView } from "../../components/Svg";
import { children, length } from "../helpers";

export const SvgSchema = z.object({
  children,
  viewBox: z.string(),
  width: length.optional(),
  height: length.optional(),
});

export const Svg = defineComponent({
  name: "Svg",
  props: SvgSchema,
  description: "A drawing for steps, parts, mechanisms, diagrams and layouts. Scales to its width; its shapes take expressions, so state can move them.",
  component: ({ props, renderNode }) => (
    <SvgView viewBox={props.viewBox} width={props.width} height={props.height}>
      {renderNode(props.children)}
    </SvgView>
  ),
});
