"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { ImageTextLarge as OpenUIImageTextLarge } from "../../components/ImageTextLarge";
import { ImageTextLargeSchema, type ImageTextLargeProps } from "./schema";

export * from "./schema";

function ImageTextLargeRenderer({ props }: ComponentRenderProps<ImageTextLargeProps>) {
  return (
    <OpenUIImageTextLarge
      src={props.src}
      alt={props.alt}
      title={props.title}
      subtitle={props.subtitle}
    />
  );
}

export const ImageTextLarge = defineComponent({
  name: "ImageTextLarge",
  props: ImageTextLargeSchema,
  description:
    "A full-width banner image above a bold title and optional subtitle. src must be a real image URL.",
  component: ImageTextLargeRenderer,
});
