import { css } from "../../styles/css";
import { markdownStyles } from "../MarkDownRenderer/markdown.styles";

export const names = {
  root: "openui-inline-markdown-renderer",
  content: "openui-inline-markdown-renderer-content",
  // No rule of its own: the composed renderer's `typography` modifier carries the look.
  typography: {
    inherit: "openui-inline-markdown-renderer--typography-inherit",
  },
} as const;

// The value dependency keeps the composed renderer before this reset, including when bundled.
Object.values(markdownStyles);

export const inlineMarkdownStyles = {
  // The span is inline by default; leave display to callers such as TextBlock's hidden row.
  root: css`
    text-align: inherit;
  `,
  content: css`
    all: unset;
    display: inline;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-align: inherit;
    margin: 0;
    padding: 0;
  `,
};
