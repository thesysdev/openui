"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const EmailBentoItem = defineComponent({
  name: "EmailBentoItem",
  props: z.object({
    imageSrc: z.string(),
    imageAlt: z.string(),
    title: z.string(),
    description: z.string(),
  }),
  description:
    "Data-only bento grid item with image, title, and description. Used as a child inside EmailBentoGrid.",
  component: () => null,
});
