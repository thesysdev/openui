"use client";

import { defineComponent } from "@openuidev/react-lang";
import { overviewCardItemPropsSchema } from "./schema";

export const OverviewCardItemComponent = defineComponent({
  name: "OverviewCardItem",
  props: overviewCardItemPropsSchema,
  description: "",
  component: () => null,
});
