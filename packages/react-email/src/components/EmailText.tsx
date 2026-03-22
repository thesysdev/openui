"use client";

import { Text } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const EmailText = defineComponent({
  name: "EmailText",
  props: z.object({
    text: z.string(),
  }),
  description: "Email text paragraph for body content.",
  component: ({ props }) => (
    <Text
      style={{
        color: "#374151",
        fontSize: "16px",
        lineHeight: "24px",
        margin: "0 0 16px 0",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {props.text as string}
    </Text>
  ),
});
