import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
import { Button } from "../Button";
import { Buttons } from "../Buttons";
import { AreaChartCondensed, BarChartCondensed, LineChartCondensed } from "../Charts";
import { Checklist } from "../Checklist";
import { EntityList } from "../EntityList";
import { EntityTitle } from "../EntityTitle";
import { IconButton } from "../IconButton";
import { Image } from "../Image";
import { ImageTitle } from "../ImageTitle";
import { LeadingText } from "../LeadingText";
import { ListBlock } from "../ListBlock";
import { Metric } from "../Metric";
import { TagBlock } from "../TagBlock";
import { Text } from "../Text";

export const CompositeCardBodyItemSchema = z.union([
  Text.ref,
  Metric.ref,
  EntityTitle.ref,
  Image.ref,
  AreaChartCondensed.ref,
  BarChartCondensed.ref,
  LineChartCondensed.ref,
  ListBlock.ref,
  TagBlock.ref,
  EntityList.ref,
  Checklist.ref,
]);

export const CompositeCardFooterSchema = z.object({
  price: z.optional(Metric.ref),
  // One Button, or a Buttons group (direction "column" stacks them full width),
  // or one or more IconButtons that sit in a row to the right of the price.
  button: z.optional(z.union([Button.ref, Buttons.ref, IconButton.ref, z.array(IconButton.ref)])),
});

export const CompositeCardItemSchema = z.object({
  id: z.string().optional(),
  header: z
    .union([EntityTitle.ref, ImageTitle.ref, Text.ref, Image.ref, LeadingText.ref])
    .optional(),
  body: z.array(CompositeCardBodyItemSchema).default([]),
  footer: CompositeCardFooterSchema.optional(),
  // A photo shown edge to edge across the top of the card. Last so existing
  // positional calls keep their meaning.
  media: z.optional(
    z.union([Image.ref, AreaChartCondensed.ref, BarChartCondensed.ref, LineChartCondensed.ref]),
  ),
});

export type CompositeCardItemProps = z.infer<typeof CompositeCardItemSchema>;

export const CompositeCardItem = defineComponent({
  name: "CompositeCardItem",
  props: CompositeCardItemSchema,
  description:
    'One rich white card: CompositeCardItem(id?, header?, body?, footer?, media?), e.g. CompositeCardItem("widget-pro", EntityTitle(Icon("package", "shopping"), "Widget Pro", "Best seller"), [Text("Sold this month"), Metric("2,410 units", "+12%", null, "sm")], { price: Metric("$29.00"), button: Button("View details", @ToAssistant("Show details for Widget Pro"), "secondary") }). header is an EntityTitle for a named product, company or person, an ImageTitle or Image for a real photo, or a Text title as Text("…", "h3"). body stacks the content: Text renders as 14px body copy (secondary unless emphasis is true), Metric at size "sm", EntityTitle, Image, a chart, ListBlock, TagBlock, a small EntityList, or a Checklist for what is included or done (pricing tiers, onboarding, launch readiness), which beats a ListBlock with check icons. footer holds an optional price Metric, always shown at 18px so it needs no size (pass previous for a sale), and a Button; for two actions use Buttons([primary, secondary], "column"), which stacks them full width. For compact actions, pass one IconButton or an array of them instead; they sit in a row to the right of the price. Each must open a real page (@OpenUrl) or ask a real follow-up (@ToAssistant), never a save, share or cart action the app cannot do, e.g. { price: Metric("$179"), button: [IconButton("Show similar", Icon("search"), @ToAssistant("Show headphones similar to Studio Headphones"), "secondary"), IconButton("Open product page", Icon("external-link"), @OpenUrl("https://…"), "secondary")] }. A footer Button can open the card\'s own real page with @OpenUrl. media (5th) is a real photo, with a URL from a tool result or the user and never invented, shown edge to edge across the top of the card, above the header: CompositeCardItem("lutetia", Text("Hôtel Lutetia", "h3"), [Text("Art Deco landmark on the Left Bank.")], { price: Metric("€420 / night"), button: Button("Book", @ToAssistant("Book Hôtel Lutetia"), "primary") }, Image("Hôtel Lutetia", "https://…", "16:9")). Prefer media over an Image header when the card leads with a photo. media can instead be an AreaChart, BarChart or LineChart for a compact trend across the top of a metric or trend card, such as MRR over six months or weekly signups, e.g. CompositeCardItem("mrr", Text("MRR · last 6 months", "h3"), [Metric("$84.2k", "+12%", null, "sm")], null, AreaChart(["May", "Jun", "Jul", "Aug", "Sep", "Oct"], [Series("MRR", [52, 58, 61, 66, 75, 84])])). Keep one strong block per card: never stack two big-hierarchy blocks together, such as an EntityTitle header (with its 44px badge) next to media, a chart, an ImageTitle or a large Metric. When the card already has a hero like a photo or chart, title it with a plain Text, or a LeadingText such as LeadingText(Icon("dollar-sign", "finance"), Text("MRR", "body", true)) when an icon helps, instead of an EntityTitle.',
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
