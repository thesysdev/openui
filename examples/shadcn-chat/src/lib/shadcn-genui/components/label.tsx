"use client";

import { Label as ShadcnLabel } from "@/components/ui/label";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const LabelSchema = z.object({
  text: z.string(),
  htmlFor: z.string().optional(),
});

export const Label = defineComponent({
  name: "Label",
  props: LabelSchema,
  description: "Form label. Optionally links to an input via htmlFor.",
  component: ({ props }) => <ShadcnLabel htmlFor={props.htmlFor}>{props.text}</ShadcnLabel>,
});
