"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Tag as OpenUITag } from "../../components/Tag";
import { TagSchema } from "./schema";

export * from "./schema";

export const Tag = defineComponent({
  name: "Tag",
  props: TagSchema,
  description: "Styled tag/badge with optional icon and variant",
  component: ({ props }) => (
    <OpenUITag
      text={props.text as string}
      size={props.size as "sm" | "md" | "lg" | undefined}
      variant={props.variant as "neutral" | "info" | "success" | "warning" | "danger" | undefined}
    />
  ),
});
