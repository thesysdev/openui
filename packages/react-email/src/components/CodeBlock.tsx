"use client";

import { defineComponent } from "@openuidev/react-lang";
import { CodeBlock } from "@react-email/components";
import { z } from "zod/v4";

type PrismLanguage = Parameters<typeof CodeBlock>[0]["language"];

export const EmailCodeBlock = defineComponent({
  name: "EmailCodeBlock",
  props: z.object({
    code: z.string(),
    language: z.string().optional(),
  }),
  description: "Syntax-highlighted code block for displaying code snippets in emails.",
  component: ({ props }) => (
    <CodeBlock
      code={props.code as string}
      language={((props.language as string) ?? "javascript") as PrismLanguage}
      theme={{
        base: {
          backgroundColor: "#1e1e1e",
          color: "#d4d4d4",
          padding: "16px",
          borderRadius: "6px",
          fontSize: "14px",
          lineHeight: "1.5",
          overflow: "auto",
          margin: "0 0 16px 0",
          fontFamily: "'Fira Code', 'Courier New', monospace",
        },
      }}
    />
  ),
});
