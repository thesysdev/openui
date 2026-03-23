"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Button } from "@react-email/components";
import { z } from "zod";

export const EmailButton = defineComponent({
  name: "EmailButton",
  props: z.object({
    label: z.string(),
    href: z.string(),
    backgroundColor: z.string().optional(),
  }),
  description: "Email call-to-action button with link.",
  component: ({ props }) => (
    <Button
      href={props.href as string}
      style={{
        backgroundColor: (props.backgroundColor as string) ?? "#5F51E8",
        color: "#ffffff",
        borderRadius: "6px",
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: "bold",
        textDecoration: "none",
        textAlign: "center" as const,
        display: "inline-block",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {props.label as string}
    </Button>
  ),
});
