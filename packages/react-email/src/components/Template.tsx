"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { EmailLeafChildUnion } from "../unions";
import { EmailColumn } from "./Column";
import { EmailColumns } from "./Columns";
import { EmailFooterCentered } from "./FooterCentered";
import { EmailFooterTwoColumn } from "./FooterTwoColumn";
import { EmailHeaderCenteredNav } from "./HeaderCenteredNav";
import { EmailHeaderSideNav } from "./HeaderSideNav";
import { EmailHeaderSocial } from "./HeaderSocial";
import { EmailSection } from "./Section";

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
