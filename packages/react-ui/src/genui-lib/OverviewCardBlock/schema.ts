import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
import { EntityTitle } from "../EntityTitle";
import { Metric } from "../Metric";
import { Text } from "../Text";

export const OverviewCardItemSchema = z.object({
  id: z.string().optional(),
  top: z.union([EntityTitle.ref, Text.ref]),
  bottom: z.optional(Metric.ref),
});

export const OverviewCardItem = defineComponent({
  name: "OverviewCardItem",
  props: OverviewCardItemSchema,
  description:
    "One overview card: a heading slot at the top (EntityTitle or Text) and an optional Metric at the bottom.",
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
