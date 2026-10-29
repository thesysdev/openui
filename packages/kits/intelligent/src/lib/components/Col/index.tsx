"use client";

import { defineComponent } from "@openuidev/react-lang";
import { flexStyle } from "../layoutHelpers";
import { cx } from "../style";
import { ColSchema } from "./schema";

export * from "./schema";

export const Col = defineComponent({
  name: "Col",
  props: ColSchema,
  description: "Vertical layout. Without gap it spaces blocks like an article.",
  component: ({ props, renderNode }) => (
    <div className={cx("iui-col", props.gap == null && "iui-flow")} style={flexStyle(props, true)}>
      {renderNode(props.children)}
    </div>
  ),
});
