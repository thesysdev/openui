"use client";

import { defineComponent } from "@openuidev/lang-react";
import React from "react";
import { MarkDownRenderer } from "../../components/MarkDownRenderer";
import { TextContentSchema } from "./schema";
const BODY_SIZE_VARS: Record<string, string> = {
  small: "--openui-text-body-sm",
  default: "--openui-text-body-default",
  large: "--openui-text-body-lg",
  "small-heavy": "--openui-text-body-sm-heavy",
  "large-heavy": "--openui-text-body-lg-heavy",
};

export { TextContentSchema } from "./schema";

export const TextContent = defineComponent({
  name: "TextContent",
  props: TextContentSchema,
  description:
    'Text block. Supports markdown. Optional size: "small" | "default" | "large" | "small-heavy" | "large-heavy".',
  component: ({ props }) => {
    const size = (props.size as string) ?? "default";
    const varName = BODY_SIZE_VARS[size] ?? BODY_SIZE_VARS["default"];
    const style =
      size === "default"
        ? undefined
        : ({
            "--openui-text-body-default": `var(${varName})`,
            "--openui-text-body-default-letter-spacing": `var(${varName}-letter-spacing)`,
          } as React.CSSProperties);
    const text = props.text == null ? "" : String(props.text);
    return (
      <div style={style}>
        <MarkDownRenderer textMarkdown={text} />
      </div>
    );
  },
});
