import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const overviewCardTrendSchema = z.object({
  direction: z.enum(["up", "down"]),
  value: z.number(),
});

export const overviewCardItemPropsSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  icon: z.string().optional(),
  imageSrc: z.string().optional(),
  imageAlt: z.string().optional(),
  value: z.string().optional(),
  valueSubtext: z.string().optional(),
  trend: overviewCardTrendSchema.optional(),
  id: z.string().optional(),
});

export type OverviewCardItemProps = z.infer<typeof overviewCardItemPropsSchema>;

export const OverviewCardItemComponent = defineComponent({
  name: "OverviewCardItem",
  props: overviewCardItemPropsSchema,
  description: "",
  component: () => null,
});

export const overviewCardBlockPropsSchema = z.object({
  items: z.array(OverviewCardItemComponent.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  gap: z.union([z.number(), z.string()]).optional(),
});

export type OverviewCardBlockProps = z.infer<typeof overviewCardBlockPropsSchema>;
