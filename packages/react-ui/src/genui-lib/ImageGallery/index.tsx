"use client";

import { defineComponent } from "@openuidev/react-lang";
import { ImageGallery as OpenUIImageGallery } from "../../components/ImageGallery";
import { ImageGallerySchema } from "./schema";

export { ImageGallerySchema } from "./schema";

export const ImageGallery = defineComponent({
  name: "ImageGallery",
  props: ImageGallerySchema,
  description:
    "A grid of real photos the reader can open full size: ImageGallery([{ src, alt, details? }, ...]). Use it near the top of a visual answer (a venue, destination, style or product line) to show 3–9 photos at once; details is an optional caption in the preview. Only real image URLs from a tool result or the user, never invented. For photos that are options to pick, use ImageCard instead.",
  component: ({ props }) => {
    const images = Array.isArray(props.images) ? props.images : [];
    if (!images.length) return null;
    return (
      <OpenUIImageGallery images={images as { src: string; alt?: string; details?: string }[]} />
    );
  },
});
