"use client";

import { defineComponent } from "@openuidev/react-lang";
import { ArrowUpRight } from "lucide-react";
import { Fragment } from "react";
import { z } from "zod/v4";
import { inline } from "./markdownBlocks";
import { children, color, cx, fg, webUrl } from "./style";

const str = (value: unknown) => (value == null ? "" : String(value));
const HEADING_LEVEL: Record<string, number> = { "3xl": 1, "2xl": 2, xl: 2, lg: 2, md: 3, sm: 4 };

export const Title = defineComponent({
  name: "Title",
  props: z.object({
    text: z.string(),
    size: z.enum(["sm", "md", "lg", "xl", "2xl", "3xl"]).optional(),
    color: color.optional(),
  }),
  description: "Heading; md for a card title, lg for a section, 2xl for a big number.",
  component: ({ props }) => {
    const sizeName = props.size ?? "md";
    return (
      <div role="heading" aria-level={HEADING_LEVEL[sizeName] ?? 3} className={`iui-title iui-title-${sizeName}`} style={{ color: fg(props.color) }}>
        {inline(str(props.text))}
      </div>
    );
  },
});

/** Text, or a run of strings and inline components such as Icon, Badge, Link or Math. */
const richText = z.union([z.string(), children]);
const isNode = (value: unknown) => !!value && typeof value === "object" && (value as { type?: unknown }).type === "element";

export const Text = defineComponent({
  name: "Text",
  props: z.object({
    text: richText,
    size: z.enum(["xs", "sm", "md", "lg"]).optional(),
    color: color.optional(),
    weight: z.enum(["normal", "medium", "semibold"]).optional(),
    italic: z.boolean().optional(),
    lineThrough: z.boolean().optional(),
    tabularNums: z.boolean().optional(),
    maxLines: z.number().optional(),
  }),
  description: "Paragraph; supports **bold**, *italic*, `code` and [links](https://…). text may be a list mixing strings and inline components: [Icon(\"clock\", \"sm\"), \" 25 min · \", Badge(\"Easy\")].",
  component: ({ props, renderNode }) => {
    const lines = props.maxLines && props.maxLines > 0 ? Math.round(props.maxLines) : undefined;
    return (
      <p
        className={cx("iui-text", props.size && `iui-text-${props.size}`, props.weight && `iui-weight-${props.weight}`, lines ? "iui-clamp" : undefined)}
        style={{
          color: fg(props.color),
          fontStyle: props.italic ? "italic" : undefined,
          textDecoration: props.lineThrough ? "line-through" : undefined,
          fontVariantNumeric: props.tabularNums ? "tabular-nums" : undefined,
          WebkitLineClamp: lines,
        }}
      >
        {Array.isArray(props.text)
          ? (props.text as unknown[]).flat().map((part, i) =>
              isNode(part) ? <span key={i} className="iui-inline">{renderNode(part)}</span> : <Fragment key={i}>{inline(str(part), `t${i}`)}</Fragment>,
            )
          : inline(str(props.text))}
      </p>
    );
  },
});

export const Caption = defineComponent({
  name: "Caption",
  props: z.object({ text: z.string(), color: color.optional() }),
  description: "Small secondary text.",
  component: ({ props }) => (
    <p className="iui-caption" style={{ color: fg(props.color) }}>
      {inline(str(props.text))}
    </p>
  ),
});




export const Link = defineComponent({
  name: "Link",
  props: z.object({ text: z.string(), url: z.string() }),
  description: "Opens an http(s) URL in a new tab.",
  component: ({ props }) => {
    const href = webUrl(props.url);
    if (!href) return <span>{str(props.text)}</span>;
    return (
      <a className="iui-link" href={href} target="_blank" rel="noopener noreferrer">
        {str(props.text) || new URL(href).hostname}
        <ArrowUpRight aria-hidden className="iui-link-arrow" />
      </a>
    );
  },
});
