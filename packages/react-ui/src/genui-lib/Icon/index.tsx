"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { IconWrapper } from "../../components/_shared/icons";
import { IconSchema, type IconProps } from "./schema";

export * from "./schema";

function IconRenderer({ props }: ComponentRenderProps<IconProps>) {
  if (!props.name) return null;
  return <IconWrapper name={props.name} category={props.category} />;
}

export const Icon = defineComponent({
  name: "Icon",
  props: IconSchema,
  description:
    "A lucide icon by kebab-case name (e.g. 'circle-check'). Optional category picks a topical fallback when the name doesn't resolve.",
  component: IconRenderer,
});
