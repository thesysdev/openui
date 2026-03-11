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
  description: "tags is an array of strings",
  component: ({ props }) => {
    const tags = asArray(props.tags) as string[];
    return (
      <OpenUITagBlock>
        {tags.map((tag, i) => (
          <OpenUITag key={i} text={tag} />
        ))}
      </OpenUITagBlock>
    );
  },
});
