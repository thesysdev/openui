"use client";

import { defineComponent, useStateField } from "@openuidev/react-lang";
import React from "react";
import { Callout as OpenUICallout } from "../../components/Callout";
import { MarkDownRenderer } from "../../components/MarkDownRenderer";
import { CalloutSchema } from "./schema";

export { CalloutSchema } from "./schema";

export const Callout = defineComponent({
  name: "Callout",
  props: CalloutSchema,
  description:
    "Callout banner. Optional visible is a reactive $boolean — auto-dismisses after 3s by setting $visible to false.",
  component: ({ props }) => {
    const field = useStateField("visible", props.visible);

    const hasVisibleBinding = field.isReactive;
    const isVisible = hasVisibleBinding
      ? field.value === true || (field.value as any) === "true"
      : true;

    // Auto-dismiss: set $visible = false after 3s
    React.useEffect(() => {
      if (!hasVisibleBinding || !isVisible) return;
      const timer = setTimeout(() => {
        field.setValue(false);
      }, 3000);
      return () => clearTimeout(timer);
    }, [hasVisibleBinding, isVisible, field]);

    if (!isVisible) return null;

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
        duration={hasVisibleBinding ? 3000 : undefined}
      />
    );
  },
});
