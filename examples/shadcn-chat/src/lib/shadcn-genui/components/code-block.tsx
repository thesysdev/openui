"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const CodeBlockSchema = z.object({
  code: z.string(),
  language: z.string().optional(),
  title: z.string().optional(),
});

export const CodeBlock = defineComponent({
  name: "CodeBlock",
  props: CodeBlockSchema,
  description: "Syntax-highlighted code block with optional language and title.",
  component: ({ props }) => {
    const code = props.code == null ? "" : String(props.code);
    return (
      <div className="rounded-lg border bg-muted">
        {props.title && (
          <div className="border-b px-4 py-2 text-xs font-medium text-muted-foreground">
            {props.title}
            {props.language && (
              <span className="ml-2 text-xs opacity-60">{props.language}</span>
            )}
          </div>
        )}
        <pre className="overflow-x-auto p-4">
          <code className="text-sm font-mono">{code}</code>
        </pre>
      </div>
    );
  },
});
