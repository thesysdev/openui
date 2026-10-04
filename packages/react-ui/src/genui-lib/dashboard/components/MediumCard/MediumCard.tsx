"use client";

import { defineComponent } from "@openuidev/react-lang";
import { AppCardRenderer, createCardPropsSchema, mediumCardChildSchema } from "../shared/cardShell";

export const MediumCardComponent = defineComponent({
  name: "MediumCard",
  props: createCardPropsSchema(mediumCardChildSchema),
  description: "",
  component: (args) => <AppCardRenderer {...args} size="medium" />,
});
