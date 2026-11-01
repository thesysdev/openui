"use client";

import { CardDescription, CardTitle, CardHeader as ShadcnCardHeader } from "@/components/ui/card";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const CardHeaderSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

export const CardHeader = defineComponent({
  name: "CardHeader",
  props: CardHeaderSchema,
  description: "Title and optional description, at the top of the dashboard or of a Card.",
  component: ({ props }) => (
    <ShadcnCardHeader className="p-0">
      <CardTitle>{props.title}</CardTitle>
      {props.description && <CardDescription>{props.description}</CardDescription>}
    </ShadcnCardHeader>
  ),
});
