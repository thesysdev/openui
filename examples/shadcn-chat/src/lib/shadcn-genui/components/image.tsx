"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const ImageSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
});

export const Image = defineComponent({
  name: "Image",
  props: ImageSchema,
  description: "Displays an image with optional alt text.",
  component: ({ props }) => (
    <div className="overflow-hidden rounded-lg">
      <img
        src={props.src}
        alt={props.alt ?? ""}
        className="w-full h-auto object-cover rounded-lg"
      />
    </div>
  ),
});

const ImageBlockSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

export const ImageBlock = defineComponent({
  name: "ImageBlock",
  props: ImageBlockSchema,
  description: "Image with optional caption.",
  component: ({ props }) => (
    <figure className="space-y-2">
      <div className="overflow-hidden rounded-lg">
        <img
          src={props.src}
          alt={props.alt ?? ""}
          className="w-full h-auto object-cover rounded-lg"
        />
      </div>
      {props.caption && (
        <figcaption className="text-sm text-muted-foreground text-center">
          {props.caption}
        </figcaption>
      )}
    </figure>
  ),
});
