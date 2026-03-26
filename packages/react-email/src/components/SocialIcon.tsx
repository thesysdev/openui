"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const EmailSocialIcon = defineComponent({
  name: "EmailSocialIcon",
  props: z.object({
    src: z.string(),
    alt: z.string(),
    href: z.string(),
  }),
  description: "Social media icon link for email headers. src should be a square icon image URL.",
  component: () => null,
});
