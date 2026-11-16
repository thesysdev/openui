"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Photo } from "../../components/Photo";
import { ImageSchema } from "./schema";

export * from "./schema";

export const Image = defineComponent({
  name: "Image",
  props: ImageSchema,
  description:
    "Photo from a URL the user or a tool gave; never invent a URL. If it fails to load, an empty photo placeholder shows. aspectRatio is 0.2 to 5 (default 1.5).",
  component: ({ props }) => (
    <Photo
      alt={props.alt}
      src={props.src}
      aspectRatio={props.aspectRatio}
      radius={props.radius}
      fit={props.fit}
    />
  ),
});
