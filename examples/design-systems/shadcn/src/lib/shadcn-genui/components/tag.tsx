"use client";

import { Badge } from "@/components/ui/badge";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const TagSchema = z.object({
  text: z.string(),
  variant: z.enum(["default", "secondary", "destructive", "outline", "ghost"]).optional(),
});

export const Tag = defineComponent({
  name: "Tag",
  props: TagSchema,
  description: "Styled tag/badge. Used inside TagBlock.",
  component: ({ props }) => <Badge variant={props.variant ?? "secondary"}>{props.text}</Badge>,
});

export const TagBlock = defineComponent({
  name: "TagBlock",
  props: z.object({
    tags: z.array(z.union([z.string(), Tag.ref])),
  }),
  description: "Group of tags. Accepts string array or Tag references.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tags = (props.tags ?? []) as any[];
    return (
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => {
          if (typeof tag === "string") {
            return (
              <Badge key={i} variant="secondary">
                {tag}
              </Badge>
            );
          }
          const text = String(tag?.props?.text ?? "");
          const variant = tag?.props?.variant ?? "secondary";
          return (
            <Badge key={i} variant={variant}>
              {text}
            </Badge>
          );
        })}
      </div>
    );
  },
});
