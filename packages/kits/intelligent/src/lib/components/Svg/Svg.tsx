"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { children, length, size } from "../style";
import { ok } from "./helpers";

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
  component: ({ props, renderNode }) => {
    const viewBox = ok(props.viewBox, /^\s*[-\d.]+(\s*[\s,]\s*[-\d.]+){3}\s*$/) ?? "0 0 100 100";
    // Without a width it fills the column, up to 1.5x the viewBox (at least 280px), so text stays in scale.
    const natural = Number(viewBox.trim().split(/[\s,]+/)[2]);
    const maxWidth = props.width == null && natural > 0 ? `${Math.max(280, natural * 1.5)}px` : undefined;
    return (
      <svg className="iui-svg" viewBox={viewBox} style={{ width: size(props.width) ?? "100%", maxWidth, height: size(props.height) }} role="img" preserveAspectRatio="xMidYMid meet">
        {renderNode(props.children)}
      </svg>
    );
  },
});
