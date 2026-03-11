"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Callout as OpenUICallout } from "../../components/Callout";
import { MarkDownRenderer } from "../../components/MarkDownRenderer";
import { CalloutSchema } from "./schema";

export { CalloutSchema } from "./schema";

export const Callout = defineComponent({
  name: "Callout",
  props: CalloutSchema,
  description: "Callout banner with variant, title, and description",
  component: ({ props }) => {
    const variantMap: Record<string, "neutral" | "info" | "warning" | "success"> = {
      info: "info",
      warning: "warning",
      success: "success",
      error: "warning",
      neutral: "neutral",
    };
    return (
      <OpenUICallout
        variant={variantMap[props.variant as string] || "info"}
        title={props.title as string}
        description={<MarkDownRenderer textMarkdown={props.description as string} />}
      />
    );
  },
});
