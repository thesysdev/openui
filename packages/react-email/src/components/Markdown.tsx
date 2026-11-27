"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Heading, Link, Text } from "@react-email/components";
import type { CSSProperties } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { z } from "zod/v4";

const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const body: CSSProperties = { color: "#374151", fontSize: "16px", lineHeight: "24px", fontFamily };
const heading = (fontSize: string): CSSProperties => ({
  color: "#1a1a1a",
  fontSize,
  margin: "0 0 12px 0",
  fontFamily,
});

// Markdown is rendered to React elements (never raw HTML), so model output cannot inject markup.
const components: Components = {
  p: ({ children }) => <Text style={{ ...body, margin: "0 0 16px 0" }}>{children}</Text>,
  h1: ({ children }) => (
    <Heading as="h1" style={heading("28px")}>
      {children}
    </Heading>
  ),
  h2: ({ children }) => (
    <Heading as="h2" style={heading("22px")}>
      {children}
    </Heading>
  ),
  h3: ({ children }) => (
    <Heading as="h3" style={heading("18px")}>
      {children}
    </Heading>
  ),
  a: ({ href, children }) => (
    <Link href={href} style={{ color: "#5F51E8", textDecoration: "underline", fontFamily }}>
      {children}
    </Link>
  ),
  li: ({ children }) => <li style={body}>{children}</li>,
  code: ({ children }) => (
    <code style={{ fontFamily: "monospace", backgroundColor: "#f3f4f6", padding: "2px 4px" }}>
      {children}
    </code>
  ),
};

export const EmailMarkdown = defineComponent({
  name: "EmailMarkdown",
  props: z.object({
    content: z.string(),
  }),
  description:
    "Renders markdown content as styled email HTML. Supports headings, bold, italic, links, lists, and code.",
  component: ({ props }) => (
    <div data-id="react-email-markdown">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]} skipHtml>
        {props.content as string}
      </ReactMarkdown>
    </div>
  ),
});
