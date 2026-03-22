"use client";

import { Separator as HeroUISeparator } from "@heroui/react";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const SeparatorSchema = z.object({
  orientation: z.enum(["horizontal", "vertical"]).optional(),
  decorative: z.boolean().optional(),
});

export const Separator = defineComponent({
  name: "Separator",
  props: SeparatorSchema,
  description: "Visual divider between content sections",
  component: ({ props }) => (
    <HeroUISeparator orientation={props.orientation} />
  ),
});
