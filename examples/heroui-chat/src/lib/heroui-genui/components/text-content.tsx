"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const TextContentSchema = z.object({
  text: z.string(),
  level: z.enum(["h2", "h3", "h4"]).optional(),
});

const levelClasses: Record<"h2" | "h3" | "h4", string> = {
  h2: "text-2xl font-semibold tracking-tight",
  h3: "text-xl font-semibold",
  h4: "text-lg font-semibold",
};

export const TextContent = defineComponent({
  name: "TextContent",
  props: TextContentSchema,
  description: "Plain text block; optional level is a section heading, omit for body paragraph.",
  component: ({ props }) => {
    const text = props.text == null ? "" : String(props.text);
    const level = props.level;
    if (level) {
      const Tag = level;
      return <Tag className={levelClasses[level]}>{text}</Tag>;
    }
    return <p className="text-base">{text}</p>;
  },
});
