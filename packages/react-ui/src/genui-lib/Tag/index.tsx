"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Tag as OpenUITag, type TagVariant } from "../../components/Tag";
import { renderIconSlot } from "../iconSlot";
import { TagSchema } from "./schema";

export * from "./schema";

export const Tag = defineComponent({
  name: "Tag",
  props: TagSchema,
  description:
    'A 24px pill: Tag(text, leading?, variant?). leading is an optional Icon for a concept, a Shape for a status dot or category marker (Tag("Online", Shape("circle", "success"))), an Avatar for a person or company, or an Emoji in rare expressive content. Pick variant by meaning: "success" positive, "danger" negative, "warning" cautionary, "info" informational, "neutral" (default) a plain label; "purple" and "pink" only to tell categories apart; "inverted" for a single high-emphasis label. Pass null for leading to set just a variant: Tag("Open", null, "success").',
  component: ({ props }) => {
    return (
      <OpenUITag
        text={props.text as string}
        icon={renderIconSlot(props["leading"])}
        variant={(props.variant ?? undefined) as TagVariant | undefined}
      />
    );
  },
});
