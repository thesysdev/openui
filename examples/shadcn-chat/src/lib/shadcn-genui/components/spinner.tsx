"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const SpinnerSchema = z.object({
  label: z.string().optional(),
  size: z.enum(["sm", "default", "lg"]).optional(),
});

const sizeClasses: Record<string, string> = {
  sm: "size-4",
  default: "size-6",
  lg: "size-8",
};

export const Spinner = defineComponent({
  name: "Spinner",
  props: SpinnerSchema,
  description: 'Animated loading spinner. size: "sm" | "default" | "lg". Optional label text.',
  component: ({ props }) => {
    const size = props.size ?? "default";
    return (
      <div className="flex items-center gap-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-muted-foreground`} />
        {props.label && (
          <span className="text-sm text-muted-foreground">{props.label}</span>
        )}
      </div>
    );
  },
});
