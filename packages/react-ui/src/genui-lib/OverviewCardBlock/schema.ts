import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
import { IconText } from "../IconText";
import { ImageText } from "../ImageText";
import { MetricIndicatorInline } from "../MetricIndicator";
import { Text } from "../Text";

export const OverviewCardItemSchema = z.object({
  id: z.string().optional(),
  top: z.union([IconText.ref, ImageText.ref, Text.ref]),
  bottom: z.optional(MetricIndicatorInline.ref),
});

export const OverviewCardItem = defineComponent({
  name: "OverviewCardItem",
  props: OverviewCardItemSchema,
  description:
    "One overview card: a heading slot at the top (IconText, ImageText or Text) and an optional MetricIndicatorInline at the bottom.",
  component: () => null,
});

export const OverviewCardBlockSchema = z.object({
  items: z.array(OverviewCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});

export type OverviewCardItemProps = z.infer<typeof OverviewCardItemSchema>;
export type OverviewCardBlockProps = z.infer<typeof OverviewCardBlockSchema>;
export type OverviewCardItemNode = OverviewCardBlockProps["items"][number];
