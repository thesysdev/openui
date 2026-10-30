"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Icon as IconView } from "../../components/Icon";
import { IconSchema } from "./schema";

export * from "./schema";

export const Icon = defineComponent({
  name: "Icon",
  props: IconSchema,
  description: 'Lucide icon by name, e.g. "map-pin".',
  component: ({ props }) => <IconView name={props.name} size={props.size} color={props.color} />,
});
