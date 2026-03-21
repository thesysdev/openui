"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { EmailLeafChildUnion } from "../unions";
import { EmailColumn } from "./EmailColumn";
import { EmailColumns } from "./EmailColumns";
import { EmailFooterCentered } from "./EmailFooterCentered";
import { EmailFooterTwoColumn } from "./EmailFooterTwoColumn";
import { EmailHeaderCenteredNav } from "./EmailHeaderCenteredNav";
import { EmailHeaderSideNav } from "./EmailHeaderSideNav";
import { EmailHeaderSocial } from "./EmailHeaderSocial";
import { EmailSection } from "./EmailSection";

const EmailTemplateChildUnion = z.union([
  ...EmailLeafChildUnion.options,
  EmailSection.ref,
  EmailColumns.ref,
  EmailColumn.ref,
  EmailHeaderSideNav.ref,
  EmailHeaderCenteredNav.ref,
  EmailHeaderSocial.ref,
  EmailFooterCentered.ref,
  EmailFooterTwoColumn.ref,
]);

export const EmailTemplate = defineComponent({
  name: "EmailTemplate",
  props: z.object({
    subject: z.string(),
    previewText: z.string().optional(),
    children: z.array(EmailTemplateChildUnion),
  }),
  description:
    "Root email template. Renders a live email preview with Copy HTML export. Always provide a subject line.",
  component: function EmailTemplateView({ props, renderNode }) {
    return (
      <div
        style={{
          padding: "32px 40px",
          backgroundColor: "#fff",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        {renderNode(props.children)}
      </div>
    );
  },
});
