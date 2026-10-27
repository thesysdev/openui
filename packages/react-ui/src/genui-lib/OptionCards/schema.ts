import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Avatar } from "../Avatar";
import { Emoji } from "../Emoji";
import { Icon } from "../Icon";
import { Image } from "../Image";
import { LeadingText } from "../LeadingText";
import { Link } from "../Link";
import { Metric } from "../Metric";
import { oneOrMany } from "../oneOrMany";
import { rulesSchema } from "../rules";
import { Tag } from "../Tag";
import { TagBlock } from "../TagBlock";
import { Text } from "../Text";

export const OptionCardSchema = z.object({
  value: z.string(),
  title: z.string(),
  subtitle: oneOrMany(
    z.string(),
    Text.ref,
    Metric.ref,
    Tag.ref,
    TagBlock.ref,
    LeadingText.ref,
    Link.ref,
  ).optional(),
  leading: z.union([Icon.ref, Avatar.ref, Emoji.ref, Image.ref]).optional(),
  disabled: z.boolean().optional(),
});

export type OptionCardProps = z.infer<typeof OptionCardSchema>;

export type OptionCardLeading = NonNullable<OptionCardProps["leading"]>;

export const OptionCard = defineComponent({
  name: "OptionCard",
  props: OptionCardSchema,
  description:
    'One selectable card: OptionCard(value, title, subtitle?, leading?, disabled?), e.g. OptionCard("adventure", "Adventure", "Hiking, trekking & outdoor activities", Icon("mountain", "nature")). subtitle is one line of context: a string, or a Text, Metric, Tag, TagBlock, LeadingText or Link, or an array of them on one line, such as a price Metric for a plan. leading is an Icon for a concept, an Avatar for a person or company, a real Image, or a rare Emoji.',
  component: () => null,
});

export const OptionCardsSchema = z.object({
  name: z.string(),
  type: z.enum(["single", "multiple"]).default("single"),
  items: z.array(OptionCard.ref).default([]),
  rules: rulesSchema,
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
});

export type OptionCardsProps = z.infer<typeof OptionCardsSchema>;
