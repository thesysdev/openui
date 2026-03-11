"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Image as OpenUIImage } from "../../components/Image";
import { ImageSchema } from "./schema";

export { ImageSchema } from "./schema";

export const Image = defineComponent({
  name: "Image",
  props: ImageSchema,
  description: "Image with alt text and optional URL",
  component: ({ props }) => (
    <OpenUIImage src={(props.src as string) || ""} alt={props.alt as string} />
  ),
});
