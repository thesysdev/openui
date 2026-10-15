import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
import { Avatar } from "../Avatar";
import { Emoji } from "../Emoji";
import { Icon } from "../Icon";
import { LeadingText } from "../LeadingText";
import { Link } from "../Link";
import { Metric } from "../Metric";
import { oneOrMany } from "../oneOrMany";
import { Tag } from "../Tag";
import { Text } from "../Text";

export const insightCardColorSchema = z.enum([
  "neutral",
  "info",
  "success",
  "warning",
  "danger",
  "purple",
  "pink",
  "inverted",
]);

export const InsightCardItemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  subtitle: oneOrMany(
    z.string(),
    Text.ref,
    Metric.ref,
    Tag.ref,
    LeadingText.ref,
    Link.ref,
  ).optional(),
  overline: z.string().optional(),
  leading: z.union([Avatar.ref, Icon.ref, Emoji.ref]).optional(),
  color: insightCardColorSchema.optional(),
});

export type InsightCardItemProps = z.infer<typeof InsightCardItemSchema>;

export const InsightCardItem = defineComponent({
  name: "InsightCardItem",
  props: InsightCardItemSchema,
  description:
    'One tall insight tile: InsightCardItem(id?, title, subtitle?, overline?, leading?, color?), e.g. InsightCardItem("remote-work", "Hybrid roles are 52% of new postings", Tag("Rising", null, "success"), "Remote work", Icon("trending-up", "charts"), "info"). overline is the short label at the top, the topic or category in one to three words, with the optional leading (an Icon, Avatar or Emoji) before it. title is the insight itself, shown large at the bottom (22px), so keep it to one short sentence or phrase; it is plain text, never a Tag. subtitle sits under the title: a string, or a Text, Metric, Tag, LeadingText or Link, or an array of them on one line, such as a status Tag or a source Link. color picks a tint from the palette only, "neutral" | "info" | "success" | "warning" | "danger" | "purple" | "pink" | "inverted", and the text takes the matching colour; pick it by meaning like Tag variants, use "neutral" when nothing calls for meaning, and never invent other colours. For a tile with a real photo behind the text, use ImageCard instead.',
  component: () => null,
});

export const InsightCardSchema = z.object({
  items: z.array(InsightCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).optional(),
  responsive: z.boolean().optional(),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});

export type InsightCardProps = z.infer<typeof InsightCardSchema>;
