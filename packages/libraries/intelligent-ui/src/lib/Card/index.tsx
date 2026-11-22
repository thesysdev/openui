"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Card as CardView } from "../../components/Card";
import { CardSchema } from "./schema";

export * from "./schema";

export const Card = defineComponent({
  name: "Card",
  props: CardSchema,
  description: "Panel with a border; soft is a filled panel for summaries.",
  component: ({ props, renderNode }) => (
    <CardView variant={props.variant} padding={props.padding} gap={props.gap}>
      {renderNode(props.children)}
    </CardView>
  ),
});
