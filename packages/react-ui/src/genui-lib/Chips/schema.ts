import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Avatar } from "../Avatar";
import { Emoji } from "../Emoji";
import { Icon } from "../Icon";
import { rulesSchema } from "../rules";

export const ChipItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  leading: z.optional(z.union([Icon.ref, Avatar.ref, Emoji.ref])),
  disabled: z.boolean().optional(),
});

export type ChipItemProps = z.infer<typeof ChipItemSchema>;

export const ChipItem = defineComponent({
  name: "ChipItem",
  props: ChipItemSchema,
  description:
    'One selectable pill: ChipItem(value, label, leading?, disabled?), e.g. ChipItem("hotel", "Hotel", Icon("building", "buildings")). label is 1–3 words; leading is an optional Icon, an Avatar for a person or company, or a rare Emoji. Give every chip a leading or none of them.',
  component: () => null,
});

export const ChipsSchema = z.object({
  name: z.string(),
  type: z.enum(["single", "multiple"]).default("multiple"),
  items: z.array(ChipItem.ref).default([]),
  rules: rulesSchema,
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
});

export type ChipsProps = z.infer<typeof ChipsSchema>;
