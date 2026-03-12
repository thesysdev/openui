"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const HoverInfoSchema = z.object({
  trigger: z.string(),
  title: z.string(),
  description: z.string(),
});

export const HoverInfo = defineComponent({
  name: "HoverInfo",
  props: HoverInfoSchema,
  description:
    "Text with a rich hover card. trigger: visible text, title/description shown on hover.",
  component: ({ props }) => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="underline decoration-dotted underline-offset-4 cursor-help font-medium">
          {props.trigger}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">{props.title}</h4>
          <p className="text-sm text-muted-foreground">{props.description}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
});
