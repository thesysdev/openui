"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Badge as BadgeView } from "../../components/Badge";
import { str } from "../../shared/style";
import { BadgeSchema } from "./schema";

export * from "./schema";

export const Badge = defineComponent({
  name: "Badge",
  props: BadgeSchema,
  description: "Pill tag; icon is an optional leading lucide name.",
  component: ({ props }) => <BadgeView text={str(props.text)} color={props.color} icon={props.icon} />,
});
