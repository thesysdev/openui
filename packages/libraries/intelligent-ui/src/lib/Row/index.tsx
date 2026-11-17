"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Row as RowView } from "../../components/Row";
import { RowSchema } from "./schema";

export * from "./schema";

export const Row = defineComponent({
  name: "Row",
  props: RowSchema,
  description: "Horizontal layout; items are vertically centered.",
  component: ({ props, renderNode }) => (
    <RowView gap={props.gap} align={props.align} justify={props.justify} wrap={props.wrap}>
      {renderNode(props.children)}
    </RowView>
  ),
});
