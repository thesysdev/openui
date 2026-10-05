import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
import { BoldText } from "../BoldText";
import { IconText } from "../IconText";
import { ImageText } from "../ImageText";
import { Text } from "../Text";

export const SnippetCardItemSchema = z.object({
  id: z.string().optional(),
  lhs: z.union([IconText.ref, ImageText.ref]),
  rhs: z.union([Text.ref, BoldText.ref]).optional(),
});

export const SnippetCardItem = defineComponent({
  name: "SnippetCardItem",
  props: SnippetCardItemSchema,
  description:
    "One row-style snippet card: a label on the left (IconText or ImageText) and an optional value on the right (Text or BoldText).",
  component: () => null,
});

export const SnippetCardBlockSchema = z.object({
  items: z.array(SnippetCardItem.ref).min(2),
  layout: z.enum(["grid"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});

export type SnippetCardItemProps = z.infer<typeof SnippetCardItemSchema>;
export type SnippetCardBlockProps = z.infer<typeof SnippetCardBlockSchema>;
export type SnippetCardItemNode = SnippetCardBlockProps["items"][number];
