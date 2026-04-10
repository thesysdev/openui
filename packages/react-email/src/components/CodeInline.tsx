"use client";

import { defineComponent } from "@openuidev/react-lang";
import { CodeInline } from "@react-email/components";
import { z } from "zod/v4";

export const EmailCodeInline = defineComponent({
  name: "EmailCodeInline",
  props: z.object({
    code: z.string(),
  }),
  description: "Inline code snippet for embedding code within text.",
  component: ({ props }) => (
    <CodeInline
      style={{
        backgroundColor: "#f3f4f6",
        color: "#e11d48",
        padding: "2px 6px",
        borderRadius: "4px",
        fontSize: "14px",
        fontFamily: "'Fira Code', 'Courier New', monospace",
      }}
    >
      {props.code as string}
    </CodeInline>
  ),
});
