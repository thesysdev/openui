"use client";

import { defineComponent } from "@openuidev/react-lang";
import { cx, space } from "../style";
import { CardSchema } from "./schema";

export * from "./schema";

export const Card = defineComponent({
  name: "Card",
  props: CardSchema,
  description: "Panel with a border; soft is a filled panel for summaries.",
  component: ({ props, renderNode }) => (
    <section
      className={cx("iui-card", props.variant === "soft" && "iui-card-soft", props.gap == null && "iui-flow")}
      style={{ padding: space(props.padding), gap: space(props.gap) }}
    >
      {renderNode(props.children)}
    </section>
  ),
});
