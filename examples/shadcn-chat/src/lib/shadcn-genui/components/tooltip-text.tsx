"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const TooltipTextSchema = z.object({
  text: z.string(),
  tooltip: z.string(),
});

export const TooltipText = defineComponent({
  name: "TooltipText",
  props: TooltipTextSchema,
  description: "Text with a hover tooltip. text: visible text, tooltip: hover content.",
  component: ({ props }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="underline decoration-dotted underline-offset-4 cursor-help">
          {props.text}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{props.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  ),
});
