"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { TextContentWrapper } from "../../components/TextContentWrapper";
import { TextSchema } from "./schema";

const REGULAR = "var(--openui-font-weight-regular)";
const MEDIUM = "var(--openui-font-weight-medium)";
const REGULAR_AXIS = "var(--openui-font-variation-regular)";
const MEDIUM_AXIS = "var(--openui-font-variation-medium)";
const BOLD = "var(--openui-font-weight-bold)";
const BOLD_AXIS = "var(--openui-font-variation-bold)";
const BODY = "var(--openui-font-body)";
const HEADING = "var(--openui-font-heading)";

// Body sizes take the emphasis weight (Medium); headings are always Bold.
const FONTS: Record<string, (weight: string) => string> = {
  small: (w) => `${w} var(--openui-font-size-xs)/16px ${BODY}`,
  default: (w) => `${w} var(--openui-font-size-sm)/16px ${BODY}`,
  // Multi-line copy: matches the Markdown body (16px on a 24px line).
  body: (w) => `${w} var(--openui-font-size-md)/24px ${BODY}`,
  h1: () =>
    `${BOLD} var(--openui-font-size-4xl)/var(--openui-line-height-heading-large) ${HEADING}`,
  h2: () => `${BOLD} 22px/var(--openui-line-height-heading) ${HEADING}`,
  h3: () => `${BOLD} var(--openui-font-size-lg)/var(--openui-line-height-heading) ${HEADING}`,
};

// Headings track slightly tighter than body text (-1.2% vs the theme's -1%).
const HEADINGS = new Set(["h1", "h2", "h3"]);

/**
 * The font, "wght" axis and tracking for a Text variant, so other components
 * (Heading, LeadingText) can match Text exactly, line height included.
 */
export function getTextFont(variant: string = "default", emphasis = false) {
  const heading = HEADINGS.has(variant);
  const medium = !heading && emphasis;
  return {
    font: (FONTS[variant] ?? FONTS["default"]!)(medium ? MEDIUM : REGULAR),
    axis: heading ? BOLD_AXIS : medium ? MEDIUM_AXIS : REGULAR_AXIS,
    letterSpacing: heading ? "-0.012em" : "var(--openui-letter-spacing-normal)",
  };
}

export { TextSchema } from "./schema";

export const Text = defineComponent({
  name: "Text",
  props: TextSchema,
  description:
    'Short UI text: labels, headings, captions, single values. variant: "small" | "default" (single-line UI text), "body" (a few lines of supporting copy, 16px on a 24px line) or "h1" | "h2" | "h3" (headings). emphasis: true sets non-heading text in Medium weight. Text is for building UI; for explanations, titled prose answers, or anything with lists, tables or several paragraphs, use Markdown (with # headings) instead.',
  component: ({ props }) => {
    const variant = (props.variant as string) ?? "default";
    const { font, axis } = getTextFont(variant, !!props.emphasis);
    const style = {
      "--openui-text-body-default": font,
      // The markdown renderer reads this for the "wght" axis.
      "--openui-text-variation": axis,
      ...(HEADINGS.has(variant) && { "--openui-text-body-default-letter-spacing": "-0.012em" }),
    } as React.CSSProperties;
    const text = props.text == null ? "" : String(props.text);
    return (
      <div style={style}>
        <TextContentWrapper textMarkdown={text} />
      </div>
    );
  },
});
