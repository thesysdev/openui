"use client";

import { defineComponent } from "@openuidev/react-lang";
import { CardHeader as OpenUICardHeader } from "../../components/CardHeader";
import { CardHeaderSchema } from "./schema";

export { CardHeaderSchema } from "./schema";

export const CardHeader = defineComponent({
  name: "CardHeader",
  props: CardHeaderSchema,
  description:
    "Card title with optional subtitle. Only use directly inside a Card, never outside one.",
  component: ({ props }) => <OpenUICardHeader title={props.title} subtitle={props.subtitle} />,
});
