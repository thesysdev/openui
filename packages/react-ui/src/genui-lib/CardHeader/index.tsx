"use client";

import { defineComponent } from "@openuidev/react-lang";
import { CardHeader as OpenUICardHeader } from "../../components/CardHeader";
import { CardHeaderSchema } from "./schema";

export { CardHeaderSchema } from "./schema";

export const CardHeader = defineComponent({
  name: "CardHeader",
  props: CardHeaderSchema,
  description: "Header with optional title and subtitle",
  component: ({ props }) => <OpenUICardHeader title={props.title} subtitle={props.subtitle} />,
});
