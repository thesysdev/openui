"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const TextContentSchema = z.object({
  text: z.string(),
  size: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
});

const sizeClasses: Record<string, string> = {
  small: "text-sm text-muted-foreground",
  default: "text-base",
  large: "text-lg",
  "small-heavy": "text-sm font-semibold",
  "large-heavy": "text-lg font-semibold",
};

export const TextContent = defineComponent({
  name: "TextContent",
  props: TextContentSchema,
  description:
    'Text block with optional size. size: "small" | "default" | "large" | "small-heavy" | "large-heavy".',
  component: ({ props }) => {
    const text = props.text == null ? "" : String(props.text);
    const cls = sizeClasses[props.size ?? "default"] ?? sizeClasses["default"];
    return <p className={cls}>{text}</p>;
  },
});
