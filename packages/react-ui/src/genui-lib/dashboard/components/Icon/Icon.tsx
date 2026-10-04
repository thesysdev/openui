"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { iconPropsSchema, type IconProps } from "./schema";

export const IconComponent = defineComponent({
  name: "Icon",
  props: iconPropsSchema,
  description: "",
  component: (_: ComponentRenderProps<IconProps>) => null,
});
