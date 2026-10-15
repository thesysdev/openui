"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { Emoji as OpenUIEmoji } from "../../components/Emoji";
import { EmojiSchema, type EmojiProps } from "./schema";

export * from "./schema";

function EmojiRenderer({ props }: ComponentRenderProps<EmojiProps>) {
  return <OpenUIEmoji emoji={props.emoji} label={props.label ?? undefined} />;
}

export const Emoji = defineComponent({
  name: "Emoji",
  props: EmojiSchema,
  description:
    'A single emoji sized like an Icon, for a touch of expression in generated content: Emoji("🎉", "Celebration"). It fills the leading slot of a LeadingText or the icon of a Callout and never stands alone; for an emoji inside a sentence, type it in the Markdown text. Use it rarely, at most one or two per response, in content where it adds tone an Icon can\'t, e.g. Callout("success", "**You\'re all set!** Your trip is booked.", null, Emoji("🎉")) or LeadingText(Emoji("🌸"), Text("Cherry blossom season peaks in early April")). Never in UI chrome: dashboards, forms, tables, data rows, buttons, statuses and navigation use Icon. Don\'t stack several or use one to repeat what the text says. label is the accessible name; omit it when the emoji is decorative.',
  component: EmojiRenderer,
});
