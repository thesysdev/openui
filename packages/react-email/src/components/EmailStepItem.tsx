"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const EmailStepItem = defineComponent({
  name: "EmailStepItem",
  props: z.object({
    title: z.string(),
    description: z.string(),
  }),
  description:
    "Single numbered step with title and description. Used inside EmailNumberedSteps.",
  component: () => null,
});
