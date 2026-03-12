"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const HeadingSchema = z.object({
  text: z.string(),
  level: z.enum(["h1", "h2", "h3", "h4"]).optional(),
});

const headingClasses: Record<string, string> = {
  h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
  h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight",
};

export const Heading = defineComponent({
  name: "Heading",
  props: HeadingSchema,
  description: 'Heading text. level: "h1" | "h2" | "h3" | "h4". Defaults to "h2".',
  component: ({ props }) => {
    const level = props.level ?? "h2";
    const cls = headingClasses[level];
    switch (level) {
      case "h1": return <h1 className={cls}>{props.text}</h1>;
      case "h3": return <h3 className={cls}>{props.text}</h3>;
      case "h4": return <h4 className={cls}>{props.text}</h4>;
      default: return <h2 className={cls}>{props.text}</h2>;
    }
  },
});

const BlockquoteSchema = z.object({
  text: z.string(),
  cite: z.string().optional(),
});

export const Blockquote = defineComponent({
  name: "Blockquote",
  props: BlockquoteSchema,
  description: "Styled blockquote. Optional cite for attribution.",
  component: ({ props }) => (
    <figure>
      <blockquote className="mt-6 border-l-2 pl-6 italic text-muted-foreground">
        {props.text}
      </blockquote>
      {props.cite && (
        <figcaption className="mt-1 pl-6 text-sm text-muted-foreground">
          — {props.cite}
        </figcaption>
      )}
    </figure>
  ),
});

const InlineCodeSchema = z.object({
  code: z.string(),
});

export const InlineCode = defineComponent({
  name: "InlineCode",
  props: InlineCodeSchema,
  description: "Inline code snippet rendered with monospace font.",
  component: ({ props }) => (
    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
      {props.code}
    </code>
  ),
});
