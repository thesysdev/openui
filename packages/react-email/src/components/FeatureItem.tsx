"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const EmailFeatureItem = defineComponent({
  name: "EmailFeatureItem",
  props: z.object({
    iconSrc: z.string(),
    iconAlt: z.string(),
    title: z.string(),
    description: z.string(),
  }),
  description:
    "Single feature item with icon, title, and description. Used inside EmailFeatureGrid or EmailFeatureList.",
  component: () => null,
});
