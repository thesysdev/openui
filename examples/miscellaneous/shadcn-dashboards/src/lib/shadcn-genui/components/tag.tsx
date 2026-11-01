"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { asArray, isElement } from "../format";

const Variant = z.enum(["default", "secondary", "outline", "success", "warning", "destructive"]);

const tone: Record<string, string> = {
  success: "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300",
  destructive: "border-transparent bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

function TagBadge({ text, variant }: { text: string; variant?: string }) {
  const base = variant === "default" || variant === "outline" ? variant : "secondary";
  return (
    <Badge variant={base} className={cn(tone[variant ?? ""])}>
      {text}
    </Badge>
  );
}

export const Tag = defineComponent({
  name: "Tag",
  props: z.object({ text: z.string(), variant: Variant.optional() }),
  description:
    'Small status badge. variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive". Works as a Table cell via @Each.',
  component: ({ props }) => <TagBadge text={String(props.text ?? "")} variant={props.variant} />,
});

export const TagBlock = defineComponent({
  name: "TagBlock",
  props: z.object({ tags: z.array(z.union([z.string(), Tag.ref])) }),
  description: "A row of badges, from strings or Tag references.",
  component: ({ props }) => (
    <div className="flex flex-wrap gap-1.5">
      {asArray(props.tags).map((tag, index) =>
        isElement(tag) ? (
          <TagBadge
            key={index}
            text={String(tag.props.text ?? "")}
            variant={tag.props.variant as string | undefined}
          />
        ) : (
          <TagBadge key={index} text={String(tag ?? "")} />
        ),
      )}
    </div>
  ),
});
