"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Heading } from "@react-email/components";
import { z } from "zod";

export const EmailHeading = defineComponent({
  name: "EmailHeading",
  props: z.object({
    text: z.string(),
    level: z.number().optional(),
  }),
  description: "Email heading (h1-h6). Use level 1 for main title, 2 for section headers.",
  component: ({ props }) => {
    const level = Math.min(Math.max((props.level as number) ?? 1, 1), 6);
    const tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    return (
      <Heading
        as={tag}
        style={{
          color: "#1a1a1a",
          margin: "0 0 12px 0",
          fontSize: level === 1 ? "28px" : level === 2 ? "22px" : "18px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {props.text as string}
      </Heading>
    );
  },
});
