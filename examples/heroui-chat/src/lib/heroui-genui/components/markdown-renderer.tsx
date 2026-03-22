"use client";

import { defineComponent } from "@openuidev/react-lang";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { z } from "zod";

const MarkDownRendererSchema = z.object({
  textMarkdown: z.string(),
  variant: z.enum(["clear", "card", "sunk"]).optional(),
});

export const MarkDownRenderer = defineComponent({
  name: "MarkDownRenderer",
  props: MarkDownRendererSchema,
  description: "Renders markdown text with optional container variant",
  component: ({ props }) => {
    const text = props.textMarkdown == null ? "" : String(props.textMarkdown);
    const variant = props.variant ?? "clear";
    const variantClass =
      variant === "card"
        ? "bg-content2 rounded-lg p-4"
        : variant === "sunk"
          ? "bg-content3 rounded-lg p-4"
          : "";
    return (
      <div className={`prose prose-neutral dark:prose-invert max-w-none text-sm ${variantClass}`.trim()}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    );
  },
});
