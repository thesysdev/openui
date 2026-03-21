"use client";

import { Markdown } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const EmailMarkdown = defineComponent({
  name: "EmailMarkdown",
  props: z.object({
    content: z.string(),
  }),
  description:
    "Renders markdown content as styled email HTML. Supports headings, bold, italic, links, lists, and code.",
  component: ({ props }) => (
    <Markdown
      markdownCustomStyles={{
        p: { color: "#374151", fontSize: "16px", lineHeight: "24px" },
        link: { color: "#5F51E8", textDecoration: "underline" },
        h1: { color: "#1a1a1a", fontSize: "28px" },
        h2: { color: "#1a1a1a", fontSize: "22px" },
        h3: { color: "#1a1a1a", fontSize: "18px" },
      }}
    >
      {props.content as string}
    </Markdown>
  ),
});
