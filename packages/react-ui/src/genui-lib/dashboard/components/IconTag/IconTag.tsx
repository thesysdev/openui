"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { IconTagView } from "./IconTagView";
import { iconTagPropsSchema, type IconTagProps } from "./schema";

function IconTagRenderer({ props }: ComponentRenderProps<IconTagProps>) {
  return <IconTagView {...props} />;
}

export const IconTagComponent = defineComponent({
  name: "IconTag",
  props: iconTagPropsSchema,
  description: "",
  component: IconTagRenderer,
});

export { IconTagView } from "./IconTagView";
