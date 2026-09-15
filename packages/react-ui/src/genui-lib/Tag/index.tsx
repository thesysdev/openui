"use client";

import { defineComponent } from "@openuidev/react-lang";
import { IconWrapper } from "../../components/_shared/icons";
import { Tag as OpenUITag } from "../../components/Tag";
import { TagSchema } from "./schema";

export * from "./schema";

export const Tag = defineComponent({
  name: "Tag",
  props: TagSchema,
  description: "Styled tag/badge with optional Icon and variant",
  component: ({ props }) => {
    const icon = props["icon"] as { props?: { name?: string; category?: string } } | undefined;
    return (
      <OpenUITag
        text={props.text as string}
        icon={
          icon?.props?.name ? (
            <IconWrapper name={icon.props.name} category={icon.props.category} />
          ) : undefined
        }
        size={props.size as "sm" | "md" | "lg" | undefined}
        variant={props.variant as "neutral" | "info" | "success" | "warning" | "danger" | undefined}
      />
    );
  },
});
