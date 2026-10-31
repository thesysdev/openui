"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Photo } from "../../components/Photo";
import { ImageSchema } from "./schema";

export * from "./schema";

export const Image = defineComponent({
  name: "Image",
  props: ImageSchema,
  description: "Photo from a URL the user or a tool gave; if it fails, a photo is found for alt.",
  component: ({ props }) => (
    <Photo query={props.alt} src={props.src} aspectRatio={props.aspectRatio} radius={props.radius} fit={props.fit} />
  ),
});
