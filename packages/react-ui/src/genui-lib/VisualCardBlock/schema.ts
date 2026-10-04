import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
import { BoldText } from "../BoldText";
import { Tag } from "../Tag";

export const VisualCardItemSchema = z.object({
  body: BoldText.ref,
  id: z.string().optional(),
  bgImageSrc: z.string().optional(),
  tag: z.optional(Tag.ref),
  bgImageAlt: z.string().optional(),
});

export type VisualCardItemProps = z.infer<typeof VisualCardItemSchema>;

export const VisualCardItem = defineComponent({
  name: "VisualCardItem",
  props: VisualCardItemSchema,
  description:
    "A single photo-first card inside a VisualCardBlock: a BoldText body panel, an optional Tag, and a background image (bgImageSrc must be a real URL; bgImageAlt is its alt text).",
  component: () => null,
});

export const VisualCardBlockSchema = z.object({
  items: z.array(VisualCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});

export type VisualCardBlockProps = z.infer<typeof VisualCardBlockSchema>;
