"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Card as OpenUICard } from "../../components/Card";
import { CardSchema } from "./schema";

export { CardSchema } from "./schema";

const gapMap: Record<string, string> = {
  none: "0",
  xs: "var(--openui-space-xs)",
  s: "var(--openui-space-s)",
  m: "var(--openui-space-m)",
  l: "var(--openui-space-l)",
  xl: "var(--openui-space-xl)",
  "2xl": "var(--openui-space-2xl)",
};

const alignMap: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};

const justifyMap: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};

export const Card = defineComponent({
  name: "Card",
  props: CardSchema,
  description:
    'Styled container. variant: "card" (default, elevated) | "sunk" (recessed) | "clear" (transparent). Always full width. Accepts all Stack flex params (default: direction "column"). Cards flex to share space in row/wrap layouts.',
  component: ({ props, renderNode }) => (
    <OpenUICard
      variant={(props.variant as "card" | "sunk" | "clear") ?? "card"}
      width="full"
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: (props.direction as "row" | "column") || "column",
        flexWrap: props.wrap ? "wrap" : "nowrap",
        gap: gapMap[(props.gap as string) || "m"] || gapMap["m"],
        alignItems: alignMap[(props.align as string) || "stretch"] || "stretch",
        justifyContent: justifyMap[(props.justify as string) || "start"] || "flex-start",
      }}
    >
      {renderNode(props.children)}
    </OpenUICard>
  ),
});
