"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { EmailTemplate } from "@openuidev/react-email";
import { Form } from "../forms/Form";
import { FollowUpBlock } from "./FollowUpBlock";
import { TextContent } from "./TextContent";

export const EmailCard = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(z.union([EmailTemplate.ref, TextContent.ref, FollowUpBlock.ref, Form.ref])),
  }),
  description: "Root container for email chat responses",
  component: ({ props, renderNode }) => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {renderNode(props.children)}
      </div>
    );
  },
});
