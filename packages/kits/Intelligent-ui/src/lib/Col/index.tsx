"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Col as ColView } from "../../components/Col";
import { ColSchema } from "./schema";

export * from "./schema";

export const Col = defineComponent({
  name: "Col",
  props: ColSchema,
  description: "Vertical layout. Without gap it spaces blocks like an article.",
  component: ({ props, renderNode }) => (
    <ColView gap={props.gap} align={props.align}>
      {renderNode(props.children)}
    </ColView>
  ),
});
