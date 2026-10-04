"use client";

import { type ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Tag } from "../../../../components/Tag";
import { TagBlock } from "../../../../components/TagBlock";
import { IconWrapper } from "../Icon/IconWrapper";
import { tagPropsSchema } from "./schema";

export const TagComponent = defineComponent({
  name: "Tag",
  props: tagPropsSchema,
  description: "",
  component: ({ props }) => (
    <Tag
      text={props.text}
      variant={props.variant}
      size="sm"
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

function TagBlockRenderer({ props }: ComponentRenderProps<TagBlockProps>) {
  return (
    <TagBlock>
      {(props.children ?? []).map((child, i) => {
        const tag = child.props;
        return (
          <Tag
            key={`tag-${tag.text}-${i}`}
            text={tag.text}
            variant={tag.variant}
            size="sm"
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
