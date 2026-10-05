"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Tag as OpenUITag } from "../../components/Tag";
import { TagBlock as OpenUITagBlock } from "../../components/TagBlock";
import { asArray } from "../helpers";
import { TagBlockSchema } from "./schema";

export * from "./schema";

export const TagBlock = defineComponent({
  name: "TagBlock",
  props: TagBlockSchema,
  description: "tags is an array of strings; optional size sm | md | lg",
  component: ({ props }) => {
    const tags = asArray(props.tags) as string[];
    const size = props.size as "sm" | "md" | "lg" | undefined;
    return (
      <OpenUITagBlock>
        {tags.map((tag, i) => (
          <OpenUITag key={i} text={tag} size={size} />
        ))}
      </OpenUITagBlock>
    );
  },
});
