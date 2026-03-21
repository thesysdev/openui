"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const EmailListItem = defineComponent({
  name: "EmailListItem",
  props: z.object({
    title: z.string(),
    description: z.string(),
  }),
  description:
    "Data-only list item with title and description. Used as a child inside EmailList.",
  component: () => null,
});
