"use client";

import Divider from "@mui/material/Divider";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const SeparatorSchema = z.object({
  orientation: z.enum(["horizontal", "vertical"]).optional(),
});

export const Separator = defineComponent({
  name: "Separator",
  props: SeparatorSchema,
  description: 'Horizontal or vertical rule. orientation: "horizontal" | "vertical".',
  component: ({ props }) => {
    const orientation = props.orientation ?? "horizontal";
    return <Divider orientation={orientation} flexItem={orientation === "vertical"} />;
  },
});
