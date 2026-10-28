"use client";

import { Label as RCLabel } from "@openuidev/react-components";
import { defineComponent } from "@openuidev/react-lang";
import { str } from "../style";
import { LabelSchema } from "./schema";

export * from "./schema";

export const Label = defineComponent({
  name: "Label",
  props: LabelSchema,
  description: "Field or group label.",
  component: ({ props }) => <RCLabel>{str(props.text)}</RCLabel>,
});
