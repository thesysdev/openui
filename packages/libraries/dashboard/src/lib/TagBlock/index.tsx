"use client";

import { IconWrapper, Tag, TagBlock } from "@openuidev/react-components";
import { type ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { tagPropsSchema } from "./schema";
export const TagComponent = defineComponent({
  name: "Tag",
  props: tagPropsSchema,
  description: "",
  component: ({ props }) => (
    <Tag
      text={props.text}
      variant={props.variant}
      icon={
        props.icon ? (
          <IconWrapper name={props.icon.props.name} category={props.icon.props.category} />
        ) : undefined
      }
    />
  ),
});

const tagBlockPropsSchema = z.object({
  children: z.array(TagComponent.ref).default([]),
});

type TagBlockProps = z.infer<typeof tagBlockPropsSchema>;
type TagBlockRenderProps = TagBlockProps & { size?: "sm" | "md" | "lg" };

function TagBlockRenderer({ props }: ComponentRenderProps<TagBlockProps>) {
  const size = (props as TagBlockRenderProps).size ?? "md";

  return (
    <TagBlock>
      {(props.children ?? []).map((child, i) => {
        const tag = child.props;
        return (
          <Tag
            key={`tag-${tag.text}-${i}`}
            text={tag.text}
            variant={tag.variant}
            size={size}
            icon={
              tag.icon ? (
                <IconWrapper name={tag.icon.props.name} category={tag.icon.props.category} />
              ) : undefined
            }
          />
        );
      })}
    </TagBlock>
  );
}

export const TagBlockComponent = defineComponent({
  name: "TagBlock",
  props: tagBlockPropsSchema,
  description: "",
  component: TagBlockRenderer,
});
