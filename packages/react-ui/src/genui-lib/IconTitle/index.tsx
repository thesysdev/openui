"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { IconText as OpenUIIconText } from "../../components/IconText";
import { IconTitleSchema, type IconTitleProps } from "./schema";

export * from "./schema";

function IconTextRenderer({ props }: ComponentRenderProps<IconTitleProps>) {
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

export const IconTitle = defineComponent({
  name: "IconTitle",
  props: IconTitleSchema,
  description:
    "An icon badge with a title and optional subtitle, laid out horizontally or vertically. iconVariant sets the badge color.",
  component: IconTextRenderer,
});
