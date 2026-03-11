"use client";

import { defineComponent } from "@openuidev/react-lang";
import { ImageGallery as OpenUIImageGallery } from "../../components/ImageGallery";
import { ImageGallerySchema } from "./schema";

export { ImageGallerySchema } from "./schema";

export const ImageGallery = defineComponent({
  name: "ImageGallery",
  props: ImageGallerySchema,
  description: "Gallery grid of images with modal preview",
  component: ({ props }) => {
    const images = Array.isArray(props.images) ? props.images : [];
    if (!images.length) return null;
    return (
      <OpenUIImageGallery images={images as { src: string; alt?: string; details?: string }[]} />
    );
  },
});
