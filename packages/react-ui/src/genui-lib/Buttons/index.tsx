"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Buttons as OpenUIButtons, type ButtonsProps } from "../../components/Buttons";
import { ButtonsSchema } from "./schema";

export { ButtonsSchema } from "./schema";

const directionToVariant: Record<string, "horizontal" | "vertical"> = {
  row: "horizontal",
  column: "vertical",
};

export const Buttons = defineComponent({
  name: "Buttons",
  props: ButtonsSchema,
  description: 'Group of Button components. direction: "row" (default) | "column".',
  component: ({ props, renderNode }) => (
    <OpenUIButtons variant={directionToVariant[props.direction as string] ?? "horizontal"}>
      {renderNode(props.buttons) as ButtonsProps["children"]}
    </OpenUIButtons>
  ),
});
