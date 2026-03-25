"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Link } from "@react-email/components";
import { z } from "zod";

export const EmailLink = defineComponent({
  name: "EmailLink",
  props: z.object({
    text: z.string(),
    href: z.string(),
  }),
  description: "Inline hyperlink in email content.",
  component: ({ props }) => (
    <Link
      href={props.href as string}
      style={{
        color: "#5F51E8",
        textDecoration: "underline",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {props.text as string}
    </Link>
  ),
});
