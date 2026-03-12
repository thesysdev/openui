"use client";

import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const BadgeSchema = z.object({
  text: z.string(),
  variant: z
    .enum(["default", "secondary", "destructive", "outline", "ghost", "link"])
    .optional(),
});

export const ShadcnBadgeComponent = defineComponent({
  name: "Badge",
  props: BadgeSchema,
  description:
    'Inline label/badge. variant: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link".',
  component: ({ props }) => (
    <ShadcnBadge variant={props.variant ?? "default"}>{props.text}</ShadcnBadge>
  ),
});
