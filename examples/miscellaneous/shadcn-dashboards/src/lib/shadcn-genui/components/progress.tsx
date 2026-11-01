"use client";

import { Progress as ShadcnProgress } from "@/components/ui/progress";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const ProgressSchema = z.object({
  value: z.number(),
  label: z.string().optional(),
});

export const Progress = defineComponent({
  name: "Progress",
  props: ProgressSchema,
  description: "Progress bar showing completion percentage (0-100). Optional label.",
  component: ({ props }) => (
    <div className="space-y-1">
      {props.label && (
        <div className="flex justify-between text-sm">
          <span>{props.label}</span>
          <span className="text-muted-foreground">{props.value}%</span>
        </div>
      )}
      <ShadcnProgress value={props.value} />
    </div>
  ),
});
