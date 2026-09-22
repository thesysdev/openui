"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { ImageText as OpenUIImageText } from "../../components/ImageText";
import { ImageTextSchema, type ImageTextProps } from "./schema";

export * from "./schema";

function ImageTextRenderer({ props }: ComponentRenderProps<ImageTextProps>) {
  return (
    <OpenUIImageText
      src={props.src}
      alt={props.alt}
      title={props.title}
      subtitle={props.subtitle}
      bold={props.bold}
      layout={props.layout}
      imageSize={props.imageSize}
    />
  );
}

export const ImageText = defineComponent({
  name: "ImageText",
  props: ImageTextSchema,
  description:
    "A small square image (thumbnail/avatar) with a title and optional subtitle. src must be a real image URL.",
  component: ImageTextRenderer,
});
