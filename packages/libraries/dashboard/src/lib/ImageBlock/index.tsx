"use client";

import { ImageBlock } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { imageBlockPropsSchema, type ImageBlockProps } from "./schema";
function ImageBlockRenderer({ props }: ComponentRenderProps<ImageBlockProps>) {
  if (!props.src) return null;

  return <ImageBlock src={props.src} alt={props.alt} />;
}

export const ImageBlockComponent = defineComponent({
  name: "ImageBlock",
  props: imageBlockPropsSchema,
  description:
    "Full-width hero/banner image with rounded corners. Use inside Card for featured images, cover photos, or visual sections.",
  component: ImageBlockRenderer,
});
