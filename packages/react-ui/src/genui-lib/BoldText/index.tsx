"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { TextBlockView } from "../../components/TextBlock";
import { getMetricSubtextTone } from "../Text";
import { BoldTextSchema, type BoldTextProps } from "./schema";

export * from "./schema";

function BoldTextRenderer({ props }: ComponentRenderProps<BoldTextProps>) {
  const blockVariant = props.subtext
    ? "highlight-text-number-subtext"
    : props.variant === "number"
      ? "highlight-number"
      : "highlight-text";

  return (
    <TextBlockView
      variant={blockVariant}
      primary={props.value}
      secondary={props.subtext}
      type={props.variant}
      size={props.size}
      align="left"
      secondaryTone={getMetricSubtextTone(props.subtextVariant, props.subtext)}
    />
  );
}

export const BoldText = defineComponent({
  name: "BoldText",
  props: BoldTextSchema,
  description:
    "Emphasized (bold) text line with optional subtext. variant 'number' uses tabular number styling; subtextVariant 'metric' colors a leading +/- subtext green/red.",
  component: BoldTextRenderer,
});
