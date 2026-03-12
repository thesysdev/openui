"use client";

import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const SkeletonSchema = z.object({
  width: z.string().optional(),
  height: z.string().optional(),
  variant: z.enum(["line", "circle", "rect"]).optional(),
});

export const Skeleton = defineComponent({
  name: "Skeleton",
  props: SkeletonSchema,
  description:
    'Loading placeholder. variant: "line" (default text line), "circle" (avatar), "rect" (block).',
  component: ({ props }) => {
    const variant = props.variant ?? "line";
    if (variant === "circle") {
      return <ShadcnSkeleton className="h-12 w-12 rounded-full" />;
    }
    if (variant === "rect") {
      return (
        <ShadcnSkeleton
          style={{ width: props.width ?? "100%", height: props.height ?? "8rem" }}
          className="rounded-md"
        />
      );
    }
    return (
      <ShadcnSkeleton
        style={{ width: props.width ?? "100%", height: props.height ?? "1rem" }}
        className="rounded"
      />
    );
  },
});
