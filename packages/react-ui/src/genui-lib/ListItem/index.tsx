"use client";

import { defineComponent } from "@openuidev/lang-react";
import { z } from "zod";
import { actionSchema } from "../Action/schema";

export const ListItem = defineComponent({
  name: "ListItem",
  props: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
    actionLabel: z.string().optional(),
    action: actionSchema,
  }),
  description:
    "Item in a ListBlock — displays a title with an optional subtitle and image. When action is provided, the item becomes clickable.",
  component: () => null,
});
