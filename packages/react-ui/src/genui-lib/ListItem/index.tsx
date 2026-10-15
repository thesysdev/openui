"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
import { Avatar } from "../Avatar";
import { Button } from "../Button";
import { Buttons } from "../Buttons";
import { Emoji } from "../Emoji";
import { Icon } from "../Icon";
import { IconButton } from "../IconButton";
import { LeadingText } from "../LeadingText";
import { Link } from "../Link";
import { Metric } from "../Metric";
import { Tag } from "../Tag";
import { TagBlock } from "../TagBlock";
import { Text } from "../Text";
import { oneOrMany } from "../oneOrMany";

export const ListItem = defineComponent({
  name: "ListItem",
  props: z.object({
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
    leading: z.union([Avatar.ref, Icon.ref, Emoji.ref]).optional(),
    actionLabel: z.string().optional(),
    action: actionPropSchema.optional(),
    actionSlot: z.union([Button.ref, Buttons.ref, IconButton.ref]).optional(),
  }),
  description:
    'One row in a ListBlock: ListItem(title, subtitle?, leading?, actionLabel?, action?, actionSlot?). title is a string, or a Text, Link or Tag. For a step or option with a name plus a description, emphasize the name with the "body" Text variant (it lines up with the number) and put the description in subtitle: ListItem(Text("Read the docs", "body", true), "Skim the quickstart and the component reference."). subtitle is one line of context: a string, or a Text, Metric, Tag, TagBlock, LeadingText or Link. leading is an optional Avatar (a real photo, a company logo via domain, or a tinted icon badge), an Icon, or a rare Emoji; it is 40px when the list has subtitles and 24px otherwise, and fits best in a "plain" list since numbered rows already lead with their number. The row is clickable only when it has an action (5th argument), e.g. ListItem("Cherry blossoms at Parc de Sceaux", "March – May", null, null, @ToAssistant("Tell me about cherry blossom season in Paris")); actionLabel is an optional short word shown at the right next to the chevron, e.g. "View". Use action for a whole-row drill-in like that. For an explicit verb, put real controls on the right with actionSlot (6th argument), a Button, a Buttons group or an IconButton, e.g. ListItem("Septime", "Tonight · 8:30pm", null, null, null, Button("Book", @ToAssistant("Book Septime tonight at 8:30pm"), "secondary")), or Buttons with Approve and Decline. With actionSlot the row itself is not clickable, so leave action and actionLabel out. When title or subtitle needs two or more pieces side by side, pass an array and they sit on one line, e.g. subtitle [Metric("$89", null, null, "sm"), Tag("In stock", null, "success")]; a single piece goes in directly.',
  component: () => null,
});
