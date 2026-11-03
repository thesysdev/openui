"use client";

import { MarkDownRenderer } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import clsx from "clsx";
import type { CSSProperties } from "react";
import remarkGfm from "remark-gfm";
import { markdownName, markdownStyle } from "../../shared/markdown";
import { textContentPropsSchema, type TextContentProps } from "./schema";

// MarkDownRenderer sets its body text from --openui-text-body-default, so a size
// points that token (and its letter spacing) at another body size, as react-ui's
// TextContent does. Heavy sizes also move the variable-font weight to medium.
const BODY_SIZE_TOKENS: Record<string, string> = {
  small: "--openui-text-body-sm",
  large: "--openui-text-body-lg",
  "small-heavy": "--openui-text-body-sm-heavy",
  "large-heavy": "--openui-text-body-lg-heavy",
};

function sizeStyle(size: TextContentProps["size"]): CSSProperties | undefined {
  const token = size && BODY_SIZE_TOKENS[size];
  if (!token) return undefined;
  return {
    "--openui-text-body-default": `var(${token})`,
    "--openui-text-body-default-letter-spacing": `var(${token}-letter-spacing)`,
    ...(size.endsWith("-heavy") && {
      "--openui-font-variation-regular": "var(--openui-font-variation-medium)",
    }),
  } as CSSProperties;
}

function TextContentRenderer({ props }: ComponentRenderProps<TextContentProps>) {
  const markdown = (
    <MarkDownRenderer
      textMarkdown={props.text ?? ""}
      className={clsx(markdownStyle, markdownName)}
      options={{
        // singleTilde: false → only ~~double tildes~~ render as strikethrough.
        remarkPlugins: [[remarkGfm, { singleTilde: false }]],
      }}
    />
  );
  const style = sizeStyle(props.size);
  return style ? <div style={style}>{markdown}</div> : markdown;
}

export const TextContentComponent = defineComponent({
  name: "TextContent",
  props: textContentPropsSchema,
  description:
    'Markdown text. size sets the body size: "small", "default", "large", "small-heavy" or "large-heavy".',
  component: TextContentRenderer,
});
