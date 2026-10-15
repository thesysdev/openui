import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { LeadingText } from "../LeadingText";
import { Link } from "../Link";
import { Metric } from "../Metric";
import { Tag } from "../Tag";
import { TagBlock } from "../TagBlock";
import { Text } from "../Text";
import { oneOrMany } from "../oneOrMany";

export const ChecklistItemSchema = z.object({
  title: oneOrMany(z.string(), Text.ref, Link.ref, Tag.ref),
  subtitle: oneOrMany(
    z.string(),
    Text.ref,
    Metric.ref,
    Tag.ref,
    TagBlock.ref,
    LeadingText.ref,
    Link.ref,
  ).optional(),
  checked: z.boolean().optional(),
  value: z.string().optional(),
});

export function createChecklistSchema(ChecklistItem: { ref: any }) {
  return z.object({
    items: z.array(ChecklistItem.ref),
    name: z.string().optional(),
    value: reactive(z.record(z.string(), z.boolean()).optional()),
  });
}
