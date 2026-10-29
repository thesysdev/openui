"use client";

import { defineComponent } from "@openuidev/react-lang";
import { flexStyle } from "../layoutHelpers";
import { RowSchema } from "./schema";

export * from "./schema";

export const Row = defineComponent({
  name: "Row",
  props: RowSchema,
  description: "Horizontal layout; items are vertically centered.",
  component: ({ props, renderNode }) => (
    <div className="iui-row" style={flexStyle(props)}>
      {renderNode(props.children)}
    </div>
  ),
});
