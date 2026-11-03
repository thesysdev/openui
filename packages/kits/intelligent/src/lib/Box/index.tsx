"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Box as BoxView } from "../../components/Box";
import { BoxSchema } from "./schema";

export * from "./schema";

export const Box = defineComponent({
  name: "Box",
  props: BoxSchema,
  description: "Flex container, a column by default. radius also clips the content.",
  component: ({ props, renderNode }) => (
    <BoxView
      direction={props.direction}
      gap={props.gap}
      padding={props.padding}
      background={props.background}
      radius={props.radius}
      border={props.border}
      width={props.width}
      height={props.height}
      flex={props.flex}
      align={props.align}
      justify={props.justify}
      wrap={props.wrap}
    >
      {renderNode(props.children)}
    </BoxView>
  ),
});
