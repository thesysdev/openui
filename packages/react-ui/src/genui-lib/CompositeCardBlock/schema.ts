import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
import { BoldText } from "../BoldText";
import { Button } from "../Button";
import { AreaChartCondensed, BarChartCondensed, LineChartCondensed } from "../Charts";
import { EntityList } from "../EntityList";
import { IconText } from "../IconText";
import { Image } from "../Image";
import { ImageText } from "../ImageText";
import { ImageTextLarge } from "../ImageTextLarge";
import { ListBlock } from "../ListBlock";
import { MetricIndicatorInline, MetricIndicatorWithStrikethrough } from "../MetricIndicator";
import { TagBlock } from "../TagBlock";
import { Text } from "../Text";

export const CompositeCardBodyItemSchema = z.union([
  Text.ref,
  BoldText.ref,
  MetricIndicatorInline.ref,
  IconText.ref,
  Image.ref,
  AreaChartCondensed.ref,
  BarChartCondensed.ref,
  LineChartCondensed.ref,
  ListBlock.ref,
  TagBlock.ref,
  EntityList.ref,
]);

export const CompositeCardFooterSchema = z.object({
  price: z.union([BoldText.ref, MetricIndicatorWithStrikethrough.ref]).optional(),
  button: z.optional(Button.ref),
});

export const CompositeCardItemSchema = z.object({
  id: z.string().optional(),
  header: z
    .union([IconText.ref, ImageText.ref, ImageTextLarge.ref, Text.ref, Image.ref])
    .optional(),
  body: z.array(CompositeCardBodyItemSchema).default([]),
  footer: CompositeCardFooterSchema.optional(),
});

export type CompositeCardItemProps = z.infer<typeof CompositeCardItemSchema>;

export const CompositeCardItem = defineComponent({
  name: "CompositeCardItem",
  props: CompositeCardItemSchema,
  description:
    "A single card inside a CompositeCardBlock: an optional header (icon/image/text), a stack of body elements (text, metrics, charts, lists, tags), and an optional price/button footer.",
  component: () => null,
});

export const CompositeCardBlockSchema = z.object({
  items: z.array(CompositeCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});

export type CompositeCardBlockProps = z.infer<typeof CompositeCardBlockSchema>;
