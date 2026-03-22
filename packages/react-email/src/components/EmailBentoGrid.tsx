"use client";

import { Column, Heading, Img, Link, Row, Section, Text } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { EmailBentoItem } from "./EmailBentoItem";

export const EmailBentoGrid = defineComponent({
  name: "EmailBentoGrid",
  props: z.object({
    heroTitle: z.string(),
    heroDescription: z.string(),
    heroLinkText: z.string().optional(),
    heroLinkHref: z.string().optional(),
    heroImageSrc: z.string(),
    heroImageAlt: z.string(),
    items: z.array(EmailBentoItem.ref),
  }),
  description:
    "Bento grid layout with a dark hero section (title, description, link, image) on top and a row of product cards below. Pass EmailBentoItem children for the bottom row. Great for marketing and product showcase emails.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.items ?? []) as any[];

    return (
      <Section style={{ overflow: "hidden" }}>
        {/* Hero section */}
        <Section>
          <Row
            style={{
              backgroundColor: "#292524",
              margin: 0,
              tableLayout: "fixed",
              width: "100%",
            }}
          >
            <Column style={{ padding: 24 }}>
              <Heading
                as="h1"
                style={{
                  color: "#ffffff",
                  fontSize: 28,
                  fontWeight: 700,
                  marginBottom: 10,
                  marginTop: 0,
                }}
              >
                {props.heroTitle as string}
              </Heading>
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 14,
                  lineHeight: "20px",
                  margin: 0,
                }}
              >
                {props.heroDescription as string}
              </Text>
              {props.heroLinkText && props.heroLinkHref && (
                <Link
                  href={props.heroLinkHref as string}
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    display: "block",
                    fontSize: 14,
                    lineHeight: "20px",
                    fontWeight: 600,
                    marginTop: 12,
                    textDecoration: "none",
                  }}
                >
                  {props.heroLinkText as string} →
                </Link>
              )}
            </Column>
            <Column style={{ width: "42%", height: 250 }}>
              <Img
                src={props.heroImageSrc as string}
                alt={props.heroImageAlt as string}
                style={{
                  borderRadius: 4,
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  width: "100%",
                }}
              />
            </Column>
          </Row>
        </Section>

        {/* Items row */}
        {items.length > 0 && (
          <Section style={{ marginBottom: 24 }}>
            <Row
              style={{
                tableLayout: "fixed",
                width: "100%",
              }}
            >
              {items.map((item, i) => {
                const imageSrc = String(item?.props?.imageSrc ?? "");
                const imageAlt = String(item?.props?.imageAlt ?? "");
                const title = String(item?.props?.title ?? "");
                const description = String(item?.props?.description ?? "");

                return (
                  <Column
                    key={i}
                    style={{
                      padding: 12,
                    }}
                  >
                    <Img
                      src={imageSrc}
                      alt={imageAlt}
                      style={{
                        borderRadius: 4,
                        marginBottom: 18,
                        width: "100%",
                      }}
                    />
                    <Heading
                      as="h3"
                      style={{
                        fontSize: 14,
                        lineHeight: "20px",
                        fontWeight: 700,
                        marginBottom: 8,
                        marginTop: 0,
                        color: "#111827",
                      }}
                    >
                      {title}
                    </Heading>
                    <Text
                      style={{
                        color: "#6B7280",
                        fontSize: 12,
                        lineHeight: "20px",
                        margin: 0,
                        paddingRight: 12,
                      }}
                    >
                      {description}
                    </Text>
                  </Column>
                );
              })}
            </Row>
          </Section>
        )}
      </Section>
    );
  },
});
