"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const EmailPricingFeature = defineComponent({
  name: "EmailPricingFeature",
  props: z.object({
    text: z.string(),
  }),
  description: "Single pricing feature line item. Used inside EmailPricingCard.",
  component: () => null,
});
