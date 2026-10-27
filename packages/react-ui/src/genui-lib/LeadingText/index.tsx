"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { TextWithIcon as OpenUITextWithIcon } from "../../components/TextWithIcon";
import { getTextFont } from "../Text";
import { LeadingTextSchema, type LeadingTextProps } from "./schema";

export * from "./schema";

type TextNode = { props?: { variant?: string; emphasis?: boolean } };

function TextWithIconRenderer({ props, renderNode }: ComponentRenderProps<LeadingTextProps>) {
  // Size the icon frame off the Text's own variant so it aligns at any size.
  const textProps = (props.text as TextNode | undefined)?.props;
  const { font } = getTextFont(textProps?.variant ?? "default", !!textProps?.emphasis);
  return (
    <OpenUITextWithIcon
      icon={renderNode(props.leading)}
      font={font}
      tone={props.tone}
      variant={textProps?.variant ?? "default"}
      emphasis={!!textProps?.emphasis}
    >
      {renderNode(props.text)}
    </OpenUITextWithIcon>
  );
}

export const LeadingText = defineComponent({
  name: "LeadingText",
  props: LeadingTextSchema,
  description:
    'A leading visual in front of any Text, centered on its first line and scaled to the Text variant. leading is an Icon, an Avatar or an AvatarStack. Which to lead with: a concept, fact or status (a date, place, price, check) is an Icon, e.g. LeadingText(Icon("calendar", "time"), Text("Opens daily 9am–6pm")); one specific person or company is an Avatar, e.g. LeadingText(Avatar("Stripe", null, "rounded", "stripe.com", "inline", Icon("building-2", "business")), Text("Stripe")); a group of people or companies (a team, attendees, who replied) is an AvatarStack, e.g. LeadingText(AvatarStack([a1, a2, a3, a4], 3, "inline"), Text("Ada, Grace and 2 others")). Keep avatars at size "inline" here so they sit on the text line. tone "secondary" mutes both. Icon names must be exact kebab-case lucide names; an unknown name renders a plain circle.',
  component: TextWithIconRenderer,
});
