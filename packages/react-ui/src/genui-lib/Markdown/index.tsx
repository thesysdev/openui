"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import remarkGfm from "remark-gfm";
import { remarkCitations } from "../../components/_shared/remark/remarkCitations";
import { remarkHighlight } from "../../components/_shared/remark/remarkHighlight";
import { TextContentCitation } from "../../components/Citation";
import { FaviconLink } from "../../components/Link";
import { MarkDownRenderer as OpenUIMarkDownRenderer } from "../../components/MarkDownRenderer";
import { MarkdownSchema } from "./schema";

export { MarkdownSchema } from "./schema";

// Long-form body: 16px on a 24px line.
const BODY_STYLE = {
  "--openui-text-body-default":
    "var(--openui-font-weight-regular) var(--openui-font-size-md)/24px var(--openui-font-body)",
} as React.CSSProperties;

// singleTilde: false keeps a lone ~ ("~$886K") literal; only ~~x~~ strikes.
// remarkCitations resolves inline [n] against the enclosing Card's sources.
// remarkHighlight turns ==key phrase== into <mark>.
const OPTIONS = {
  remarkPlugins: [[remarkGfm, { singleTilde: false }], remarkCitations, remarkHighlight],
  components: {
    span: TextContentCitation,
    // Web links get the site's favicon before their text.
    a: ({ node: _node, ...props }: React.ComponentProps<"a"> & { node?: unknown }) => (
      <FaviconLink {...props} className="openui-markdown-renderer-link" />
    ),
  },
} as React.ComponentProps<typeof OpenUIMarkDownRenderer>["options"];

export const Markdown = defineComponent({
  name: "Markdown",
  props: MarkdownSchema,
  description:
    "Long-form markdown prose: explanations, summaries and the top-level text that sets context around UI. Supports headings, lists, task lists, tables, quotes and code. When an answer needs a title, start the Markdown with a # heading instead of a separate Text heading. Not for short UI labels or single values; use Text for those.",
  component: ({ props }) => (
    <div style={BODY_STYLE}>
      <OpenUIMarkDownRenderer textMarkdown={props.textMarkdown as string} options={OPTIONS} />
    </div>
  ),
});
