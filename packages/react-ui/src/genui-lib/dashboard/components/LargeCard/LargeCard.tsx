"use client";

import { defineComponent } from "@openuidev/react-lang";
import { AppCardRenderer, createCardPropsSchema, largeCardChildSchema } from "../shared/cardShell";

export const LargeCardComponent = defineComponent({
  name: "LargeCard",
  props: createCardPropsSchema(largeCardChildSchema),
  description: "",
  component: (args) => <AppCardRenderer {...args} size="large" />,
});
