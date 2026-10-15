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
import { TagBlock } from "../TagBlock";
import { Text } from "../Text";

export const ValueCardItemSchema = z.object({
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
  leading: z.union([Avatar.ref, Icon.ref, Emoji.ref]).optional(),
  value: oneOrMany(Metric.ref, Text.ref, Tag.ref, TagBlock.ref, LeadingText.ref).optional(),
});

export const ValueCardItem = defineComponent({
  name: "ValueCardItem",
  props: ValueCardItemSchema,
  description:
    "One card in a ValueCard: ValueCardItem(id?, title, subtitle?, leading?, value?). title says what the value is; subtitle adds a short context line (a string, or a Text, Metric, Tag, LeadingText or Link, or an array of them on one line); leading is an optional Avatar (a photo, logo or tinted icon badge), Icon or Emoji. In a horizontal card with a subtitle, the title stacks over the subtitle beside a 36px leading (an Avatar fills it, a bare Icon becomes a neutral badge) and the value sits on the right; without a subtitle the leading sits inline before the title like a LeadingText. In a vertical card the leading and title share one line, the subtitle sits under the title, and the hero value follows below. value is a Metric, Text, Tag, TagBlock or LeadingText, or an array of them on one line.",
  component: () => null,
});

export const ValueCardSchema = z.object({
  items: z.array(ValueCardItem.ref).min(2),
  layout: z.enum(["horizontal", "vertical"]).optional(),
  responsive: z.boolean().optional(),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
  carousel: z.boolean().optional(),
});

export type ValueCardItemProps = z.infer<typeof ValueCardItemSchema>;
export type ValueCardProps = z.infer<typeof ValueCardSchema>;
export type ValueCardItemNode = ValueCardProps["items"][number];
