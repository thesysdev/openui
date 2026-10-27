"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { IconWrapper } from "../../components/_shared/icons";
import { IconSchema, type IconProps } from "./schema";

export * from "./schema";

function IconRenderer({ props }: ComponentRenderProps<IconProps>) {
  if (!props.name) return null;
  return <IconWrapper name={props.name} category={props.category} />;
}

export const Icon = defineComponent({
  name: "Icon",
  props: IconSchema,
  description:
    'A lucide line icon, named by its exact kebab-case lucide name: Icon("circle-check"), Icon("calendar"), Icon("map-pin"). It never stands alone: it fills the icon slot of another component (LeadingText, Tag, ChipItem, Avatar, EntityTitle, IconButton, OptionCard), and that host sets its size, stroke and color, so Icon has no size or color of its own. In LeadingText it scales with the Text (about 1.1–1.2em, 1.5 stroke) and takes the text\'s color. The name is looked up in lucide when it renders; an unknown or misspelled name shows a plain circle, so use only names you know exist and prefer common ones over guesses. category is optional and does not change the icon. Use Icon for a concept, fact or status; for a specific real person or company put an Avatar in the same slot.',
  component: IconRenderer,
});
