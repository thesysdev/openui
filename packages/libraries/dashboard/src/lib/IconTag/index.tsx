"use client";

import { IconTag } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { toIconProps } from "../iconProps";
import { iconTagPropsSchema, type IconTagProps } from "./schema";
/**
 * Thin adapter over react-components' IconTag — same sizes, same variants,
 * same IconWrapper. The kit only converts the openui-lang icon node.
 */
function IconTagRenderer({ props }: ComponentRenderProps<IconTagProps>) {
  const icon = toIconProps(props.icon);
  if (!icon) return null;
  return <IconTag icon={icon} size={props.size} variant={props.variant} />;
}

export const IconTagComponent = defineComponent({
  name: "IconTag",
  props: iconTagPropsSchema,
  description: "",
  component: IconTagRenderer,
});
