"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { z } from "zod";
import { EmailSocialIcon } from "./SocialIcon";

export const EmailFooterTwoColumn = defineComponent({
  name: "EmailFooterTwoColumn",
  props: z.object({
    logoSrc: z.string(),
    logoAlt: z.string(),
    companyName: z.string(),
    tagline: z.string().optional(),
    address: z.string(),
    contact: z.string().optional(),
    icons: z.array(EmailSocialIcon.ref).optional(),
  }),
  description:
    "Two-column footer with logo and company info on the left, social icons and address on the right. Uses EmailSocialIcon items.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const icons = (props.icons ?? []) as any[];

    return (
      <Section>
        <Row>
          <Column style={{ verticalAlign: "bottom" }}>
            <Img alt={props.logoAlt as string} height="42" src={props.logoSrc as string} />
            <Text
              style={{
                margin: "8px 0",
                fontWeight: 600,
                fontSize: "16px",
                color: "#111827",
                lineHeight: "24px",
              }}
            >
              {props.companyName as string}
            </Text>
            {props.tagline && (
              <Text
                style={{
                  marginTop: "4px",
                  marginBottom: 0,
                  fontSize: "16px",
                  color: "#6b7280",
                  lineHeight: "24px",
                }}
              >
                {props.tagline as string}
              </Text>
            )}
          </Column>
          <Column align="left" style={{ verticalAlign: "bottom" }}>
            {icons.length > 0 && (
              <Row
                style={{
                  display: "table-cell",
                  height: "44px",
                  width: "56px",
                  verticalAlign: "bottom",
                }}
              >
                {icons.map((icon, i) => (
                  <Column key={i} style={{ paddingRight: i < icons.length - 1 ? "8px" : 0 }}>
                    <Link href={String(icon?.props?.href ?? "#")}>
                      <Img
                        alt={String(icon?.props?.alt ?? "")}
                        height="36"
                        src={String(icon?.props?.src ?? "")}
                        width="36"
                      />
                    </Link>
                  </Column>
                ))}
              </Row>
            )}
            <Row>
              <Text
                style={{
                  margin: "8px 0",
                  fontWeight: 600,
                  fontSize: "16px",
                  color: "#6b7280",
                  lineHeight: "24px",
                }}
              >
                {props.address as string}
              </Text>
              {props.contact && (
                <Text
                  style={{
                    marginTop: "4px",
                    marginBottom: 0,
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "#6b7280",
                    lineHeight: "24px",
                  }}
                >
                  {props.contact as string}
                </Text>
              )}
            </Row>
          </Column>
        </Row>
      </Section>
    );
  },
});
