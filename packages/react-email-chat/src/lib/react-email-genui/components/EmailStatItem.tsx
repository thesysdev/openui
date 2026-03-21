"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const EmailStatItem = defineComponent({
  name: "EmailStatItem",
  props: z.object({
    value: z.string(),
    label: z.string(),
  }),
  description:
    "Single stat with a value and label. Used inside EmailStats.",
  component: () => null,
});
