"use client";

import {
  CardDescription,
  CardHeader as ShadcnCardHeader,
  CardTitle,
} from "@/components/ui/card";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const CardHeaderSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

export const CardHeader = defineComponent({
  name: "CardHeader",
  props: CardHeaderSchema,
  description: "Title/description header block for a Card.",
  component: ({ props }) => (
    <ShadcnCardHeader className="p-0">
      <CardTitle>{props.title}</CardTitle>
      {props.description && <CardDescription>{props.description}</CardDescription>}
    </ShadcnCardHeader>
  ),
});
