"use client";

import { defineComponent } from "@openuidev/react-lang";
import { TextCallout as OpenUITextCallout } from "../../components/TextCallout";
import { TextCalloutSchema } from "./schema";

export { TextCalloutSchema } from "./schema";

export const TextCallout = defineComponent({
  name: "TextCallout",
  props: TextCalloutSchema,
  description: "Text callout with variant, title, and description",
  component: ({ props }) => (
    <OpenUITextCallout
      variant={props.variant as "neutral" | "info" | "warning" | "success" | "danger" | undefined}
      title={props.title}
      description={props.description}
    />
  ),
});
