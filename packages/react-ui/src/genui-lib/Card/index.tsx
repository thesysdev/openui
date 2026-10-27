"use client";

import { defineComponent } from "@openuidev/react-lang";
import { CardHeading, Card as OpenUICard } from "../../components/Card";
import { CardSchema } from "./schema";

export { CardSchema } from "./schema";

export const Card = defineComponent({
  name: "Card",
  props: CardSchema,
  description: `Styled container, never borderless. variant: "outlined" (default, a thin border on a transparent background) | "lifted" (white, with the same border plus a soft shadow, to raise it off the page) | "sunk" (a light grey fill, no border or shadow, for a recessed group). Use "outlined" for ordinary groups such as a chart or a set of KPIs; "lifted" sparingly, for the one block that should stand out, such as a recommended option or a summary; "sunk" for secondary or nested content, such as a card inside another card or supporting notes. There is no borderless Card: to group content without a frame, use Stack (or Section for a part of the response). Never put a Table or EditableTable inside a Card: a table draws its own frame, so a Card around it doubles the border. Place it directly in a Section, TabItem or AccordionItem, with a Heading or Text title above it if it needs one. Optional title and subtitle (3rd and 4th, after variant) render as the card's own small header, 14px over 13px secondary like our other cards; use them instead of a Heading child, e.g. Card([chart], null, "Revenue by quarter", "USD thousands"). Always full width. Children stack top to bottom by default; to customise the layout (a row, a wrap, other gaps), pass a single Stack as the child, e.g. Card([Stack([a, b], "row")]). Cards flex to share space in a row Stack.`,
  component: ({ props, renderNode }) => (
    <OpenUICard
      variant={(props.variant as "outlined" | "lifted" | "sunk") ?? "outlined"}
      width="full"
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: "var(--openui-space-m)",
      }}
    >
      <CardHeading title={props.title} subtitle={props.subtitle} />
      {renderNode(props.children)}
    </OpenUICard>
  ),
});
