"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Image as OpenUIImage } from "../../components/Image";
import { ImageSchema } from "./schema";

export { ImageSchema } from "./schema";

export const Image = defineComponent({
  name: "Image",
  props: ImageSchema,
  description:
    'Image with alt text and a URL. aspectRatio crops it to a fixed frame (default "3:2"): "1:1" for logos, avatars and product shots, "4:3" or "3:2" for photos, "16:9" for hero and video-like media, "3:4" or "9:16" for portraits and phone screenshots; "auto" keeps the image\'s own proportions (charts, diagrams, screenshots that must not be cropped).',
  component: ({ props }) => (
    <OpenUIImage
      src={(props.src as string) || undefined}
      alt={props.alt as string}
      aspectRatio={
        (props.aspectRatio as "auto" | "1:1" | "4:3" | "3:2" | "16:9" | "3:4" | "9:16" | null) ??
        undefined
      }
    />
  ),
});
