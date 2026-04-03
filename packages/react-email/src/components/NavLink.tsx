"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const EmailNavLink = defineComponent({
  name: "EmailNavLink",
  props: z.object({
    text: z.string(),
    href: z.string(),
  }),
  description: "Navigation link item for email headers.",
  component: () => null,
});
