"use client";

import { Column } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { EmailLeafChildUnion } from "../unions";

export const EmailColumn = defineComponent({
  name: "EmailColumn",
  props: z.object({
    children: z.array(EmailLeafChildUnion),
  }),
  description: "A single column within an EmailColumns row.",
  component: ({ props, renderNode }) => (
    <Column style={{ verticalAlign: "top" }}>
      {renderNode(props.children)}
    </Column>
  ),
});
