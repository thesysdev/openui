"use client";

import { Chip } from "@heroui/react";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const variantToColor: Record<string, React.ComponentProps<typeof Chip>["color"]> = {
  neutral: "default",
  info: "accent",
  success: "success",
  warning: "warning",
  danger: "danger",
};

const TagSchema = z.object({
  text: z.string(),
  icon: z.string().optional(),
  size: z.enum(["sm", "md", "lg"]).optional(),
  variant: z.enum(["neutral", "info", "success", "warning", "danger"]).optional(),
});

export const Tag = defineComponent({
  name: "Tag",
  props: TagSchema,
  description: "Styled tag/badge",
  component: ({ props }) => {
    const color = variantToColor[props.variant ?? "neutral"];
    return (
      <Chip size={props.size} color={color}>
        {props.text}
      </Chip>
    );
  },
});

const TagBlockSchema = z.object({
  tags: z.array(z.string()),
});

export const TagBlock = defineComponent({
  name: "TagBlock",
  props: TagBlockSchema,
  description: "Group of plain string tags",
  component: ({ props }) => {
    const tags = props.tags ?? [];
    return (
      <div className="flex flex-row flex-wrap gap-2">
        {tags.map((tag, i) => (
          <Chip key={i}>{tag}</Chip>
        ))}
      </div>
    );
  },
});
