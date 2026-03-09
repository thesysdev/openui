"use client";

import { defineComponent } from "@openuidev/lang-react";
import { z } from "zod";

export const ListItem = defineComponent({
  name: "ListItem",
  props: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
  }),
  description: "Item in a ListBlock — when clicked, sends title as user message",
  component: () => null,
});
