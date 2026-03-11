"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const FollowUpItem = defineComponent({
  name: "FollowUpItem",
  props: z.object({
    text: z.string(),
  }),
  description: "Clickable follow-up suggestion — when clicked, sends text as user message",
  component: () => null,
});
