"use client";

import { defineComponent } from "@openuidev/lang-react";
import { Card as OpenUICard } from "../../components/Card";
import { CardSchema } from "./schema";

export { CardSchema } from "./schema";

export const Card = defineComponent({
  name: "Card",
  props: CardSchema,
  description:
    'Styled container. variant: "card" (default, elevated) | "sunk" (recessed) | "clear" (transparent). Children stack vertically with consistent spacing. Always full width.',
  component: ({ props, renderNode }) => (
    <OpenUICard
      variant={(props.variant as "card" | "sunk" | "clear") ?? "card"}
      width="full"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--openui-space-m)",
      }}
    >
      {renderNode(props.children)}
    </OpenUICard>
  ),
});
