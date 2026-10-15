"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { EntityTitle } from "../EntityTitle";
import { LeadingText } from "../LeadingText";
import { Metric } from "../Metric";
import { Tag } from "../Tag";
import { Text } from "../Text";
import { oneOrMany } from "../oneOrMany";

export const EntityListItemSchema = z.object({
  left: oneOrMany(z.string(), EntityTitle.ref, LeadingText.ref),
  right: oneOrMany(z.string(), Metric.ref, Tag.ref, Text.ref).optional(),
  rightVariant: z.enum(["text", "number"]).optional(),
});

export type EntityListItemProps = z.infer<typeof EntityListItemSchema>;

export const EntityListItem = defineComponent({
  name: "EntityListItem",
  props: EntityListItemSchema,
  description:
    'One row of an EntityList: EntityListItem(left, right?, rightVariant?), e.g. EntityListItem("Check-in", "3pm"). left is a plain string for a key/value fact, an EntityTitle for a person, company or product, a LeadingText for a fact with an icon, or an array of these when it needs two pieces side by side. right is an optional value: a string, a Metric for a number with its change, a Tag for a status, a Text, or an array of these shown on one line; leave it out for a plain list of entities. rightVariant "number" lines up string numbers with tabular figures; a Metric doesn\'t need it. The same item also serves as the EntityList header (column labels, e.g. EntityListItem("Item", "Price")) and footer (a total, e.g. EntityListItem("Total", "$142.50", "number")).',
  component: () => null,
});
