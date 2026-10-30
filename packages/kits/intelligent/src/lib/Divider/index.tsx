"use client";

import { Separator } from "@openuidev/react-components";
import { defineComponent } from "@openuidev/react-lang";
import { DividerSchema } from "./schema";

export * from "./schema";

export const Divider = defineComponent({
  name: "Divider",
  props: DividerSchema,
  description: "",
  component: () => <Separator />,
});
