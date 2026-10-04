"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { IconTagView } from "../IconTag/IconTagView";
import { iconTextPropsSchema, type IconTextProps } from "./schema";

function IconTextRenderer({ props }: ComponentRenderProps<IconTextProps>) {
  return <IconTagView icon={props.icon} variant={props.iconVariant} size="m" />;
}

export const IconTextComponent = defineComponent({
  name: "IconText",
  props: iconTextPropsSchema,
  description: "",
  component: IconTextRenderer,
});
