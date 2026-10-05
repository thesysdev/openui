"use client";

import { defineComponent } from "@openuidev/react-lang";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { z } from "zod";

const MarkDownRendererSchema = z.object({
  text: z.string(),
});

export const MarkDownRenderer = defineComponent({
  name: "MarkDownRenderer",
  props: MarkDownRendererSchema,
  description: "Renders markdown text with GFM support.",
  component: ({ props }) => {
    const text = props.text == null ? "" : String(props.text);
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    );
  },
});
