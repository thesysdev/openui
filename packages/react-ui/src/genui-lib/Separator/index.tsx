"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Separator as OpenUISeparator } from "../../components/Separator";
import { SeparatorSchema } from "./schema";

export * from "./schema";

export const Separator = defineComponent({
  name: "Separator",
  props: SeparatorSchema,
  description: "Visual divider between content sections",
  component: ({ props }) => (
    <OpenUISeparator
      orientation={props.orientation as "horizontal" | "vertical" | undefined}
      decorative={props.decorative as boolean | undefined}
    />
  ),
});
