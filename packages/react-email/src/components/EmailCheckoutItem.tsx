"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const EmailCheckoutItem = defineComponent({
  name: "EmailCheckoutItem",
  props: z.object({
    imageSrc: z.string().optional(),
    imageAlt: z.string().optional(),
    name: z.string(),
    quantity: z.number().optional(),
    price: z.string(),
  }),
  description:
    "Single checkout/cart item with optional image, name, quantity, and price. Used inside EmailCheckoutTable.",
  component: () => null,
});
