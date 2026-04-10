"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Column, Img, Link, Row, Section } from "@react-email/components";
import { z } from "zod/v4";
import { EmailNavLink } from "./NavLink";

export const EmailHeaderSideNav = defineComponent({
  name: "EmailHeaderSideNav",
  props: z.object({
    logoSrc: z.string(),
    logoAlt: z.string(),
    logoHeight: z.number().optional(),
    links: z.array(EmailNavLink.ref),
  }),
  description:
    "Header with logo on the left and navigation links on the right. Uses EmailNavLink items.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const links = (props.links ?? []) as any[];

    return (
      <Section style={{ padding: "40px 32px", margin: "40px 0" }}>
        <Row>
          <Column style={{ width: "80%" }}>
            <Img alt={props.logoAlt as string} height="42" src={props.logoSrc as string} />
          </Column>
          <Column align="right">
            <Row align="right">
              {links.map((link, i) => (
                <Column key={i} style={{ paddingLeft: "8px", paddingRight: "8px" }}>
                  <Link
                    href={String(link?.props?.href ?? "#")}
                    style={{
                      color: "#4b5563",
                      textDecoration: "none",
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                      fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    }}
                  >
                    {String(link?.props?.text ?? "")}
                  </Link>
                </Column>
              ))}
            </Row>
          </Column>
        </Row>
      </Section>
    );
  },
});
