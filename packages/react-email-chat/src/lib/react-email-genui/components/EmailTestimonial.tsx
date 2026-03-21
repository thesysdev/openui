"use client";

import { Column, Img, Row, Section } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const EmailTestimonial = defineComponent({
  name: "EmailTestimonial",
  props: z.object({
    quote: z.string(),
    avatarSrc: z.string(),
    avatarAlt: z.string(),
    name: z.string(),
    role: z.string(),
  }),
  description:
    "Testimonial quote with avatar, name, and role. Centered layout for social proof in emails.",
  component: ({ props }) => {
    return (
      <Section
        style={{
          textAlign: "center",
          fontSize: 14,
          lineHeight: "20px",
          color: "#4B5563",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 16,
            lineHeight: "24px",
            fontWeight: 300,
            color: "#1F2937",
          }}
        >
          {props.quote as string}
        </p>
        <Row style={{ marginTop: "32px" }} align="center">
          <Column valign="middle">
            <div
              style={{
                height: 32,
                width: 32,
                borderRadius: "9999px",
                overflow: "hidden",
                backgroundColor: "#4B5563",
              }}
            >
              <Img
                src={props.avatarSrc as string}
                width={32}
                height={32}
                alt={props.avatarAlt as string}
                style={{ height: "100%", width: "100%", objectFit: "cover" }}
              />
            </div>
          </Column>
          <Column valign="middle">
            <p
              style={{
                margin: 0,
                marginLeft: 12,
                fontSize: 14,
                lineHeight: "20px",
                fontWeight: 600,
                color: "#111827",
                marginRight: 8,
              }}
            >
              {props.name as string}
            </p>
          </Column>
          <Column valign="middle">
            <span style={{ fontSize: 14, lineHeight: "20px", marginRight: 8 }}>
              &bull;
            </span>
          </Column>
          <Column valign="middle">
            <p style={{ margin: 0, fontSize: 14, lineHeight: "20px" }}>
              {props.role as string}
            </p>
          </Column>
        </Row>
      </Section>
    );
  },
});
