"use client";

import { Separator as ShadcnSeparator } from "@/components/ui/separator";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const SeparatorSchema = z.object({
  orientation: z.enum(["horizontal", "vertical"]).optional(),
});

export const Separator = defineComponent({
  name: "Separator",
  props: SeparatorSchema,
  description: 'Horizontal or vertical rule. orientation: "horizontal" | "vertical".',
  component: ({ props }) => (
    <ShadcnSeparator orientation={props.orientation ?? "horizontal"} />
  ),
});
