"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { TextBlockView } from "../../components/TextBlock";
import { TextSchema, type TextProps } from "./schema";

export * from "./schema";

export function getMetricSubtextTone(
  subtextVariant: "text" | "number" | "metric",
  subtext?: string,
): "positive" | "negative" | undefined {
  if (subtextVariant !== "metric" || !subtext) return undefined;
  if (subtext.startsWith("+")) return "positive";
  if (subtext.startsWith("-")) return "negative";
  return undefined;
}

function TextRenderer({ props }: ComponentRenderProps<TextProps>) {
  return (
    <TextBlockView
      variant={props.subtext ? "text-subtext" : "text"}
      primary={props.value}
      secondary={props.subtext}
      type={props.variant}
      size={props.size}
      align="left"
      secondaryTone={getMetricSubtextTone(props.subtextVariant, props.subtext)}
    />
  );
}

export const Text = defineComponent({
  name: "Text",
  props: TextSchema,
  description:
    "Plain text line with optional subtext. variant 'number' uses tabular number styling; subtextVariant 'metric' colors a leading +/- subtext green/red.",
  component: TextRenderer,
});
