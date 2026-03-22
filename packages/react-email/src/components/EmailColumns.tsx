"use client";

import { Row } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { EmailColumn } from "./EmailColumn";

export const EmailColumns = defineComponent({
  name: "EmailColumns",
  props: z.object({
    children: z.array(EmailColumn.ref),
  }),
  description: "Multi-column row layout. Contains EmailColumn children.",
  component: ({ props, renderNode }) => (
    <Row style={{ margin: "0 0 16px 0" }}>
      {renderNode(props.children)}
    </Row>
  ),
});
