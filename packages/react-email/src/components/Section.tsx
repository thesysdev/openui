"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Section } from "@react-email/components";
import { z } from "zod";
import { EmailLeafChildUnion } from "../unions";

export const EmailSection = defineComponent({
  name: "EmailSection",
  props: z.object({
    children: z.array(EmailLeafChildUnion),
  }),
  description:
    "Groups email content into a section. Use to organize header, body, and footer areas.",
  component: ({ props, renderNode }) => (
    <Section style={{ margin: "0 0 24px 0" }}>{renderNode(props.children)}</Section>
  ),
});
