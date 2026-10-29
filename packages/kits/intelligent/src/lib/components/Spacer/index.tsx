"use client";

import { defineComponent } from "@openuidev/react-lang";
import { SpacerSchema } from "./schema";

export * from "./schema";

export const Spacer = defineComponent({
  name: "Spacer",
  props: SpacerSchema,
  description: "Fills the free space in a Row.",
  component: () => <div className="iui-spacer" aria-hidden />,
});
