"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { IconText as OpenUIIconText } from "../../components/IconText";
import { IconTextSchema, type IconTextProps } from "./schema";

export * from "./schema";

function IconTextRenderer({ props }: ComponentRenderProps<IconTextProps>) {
  return (
    <OpenUIIconText
      icon={props.icon.props}
      iconVariant={props.iconVariant}
      title={props.title}
      subtitle={props.subtitle}
      bold={props.bold}
      layout={props.layout}
    />
  );
}

export const IconText = defineComponent({
  name: "IconText",
  props: IconTextSchema,
  description:
    "An icon badge with a title and optional subtitle, laid out horizontally or vertically. iconVariant sets the badge color.",
  component: IconTextRenderer,
});
