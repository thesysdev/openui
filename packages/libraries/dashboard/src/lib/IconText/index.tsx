"use client";

import { IconTag } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { toIconProps } from "../iconProps";
import { iconTextPropsSchema, type IconTextProps } from "./schema";
/**
 * Despite the name, this renders only an icon badge: its schema is `icon` plus
 * `iconVariant`, with no title or subtitle. It therefore wraps
 * react-components' IconTag, NOT its IconText — that one requires a `title`
 * and uses a different variant set, so it is a different contract.
 */
function IconTextRenderer({ props }: ComponentRenderProps<IconTextProps>) {
  const icon = toIconProps(props.icon);
  if (!icon) return null;
  return <IconTag icon={icon} variant={props.iconVariant} size="m" />;
}

export const IconTextComponent = defineComponent({
  name: "IconText",
  props: iconTextPropsSchema,
  description: "",
  component: IconTextRenderer,
});
