"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Column, Hr, Img, Row, Section, Text } from "@react-email/components";
import { z } from "zod";
import { EmailFeatureItem } from "./FeatureItem";

export const EmailFeatureList = defineComponent({
  name: "EmailFeatureList",
  props: z.object({
    title: z.string(),
    description: z.string(),
    items: z.array(EmailFeatureItem.ref),
  }),
  description:
    "Vertical feature list with header title, description, and feature items separated by dividers. Each item has an icon, title, and description.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.items ?? []) as any[];

    return (
      <Section style={{ marginTop: 16, marginBottom: 16 }}>
        <Section>
          <Row>
            <Text
              style={{
                margin: "0px",
                fontSize: 24,
                lineHeight: "32px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {props.title as string}
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 16,
                lineHeight: "24px",
                color: "#6B7280",
              }}
            >
              {props.description as string}
            </Text>
          </Row>
        </Section>
        <Section>
          {items.map((item, i) => (
            <div key={i}>
              <Hr
                style={{
                  marginLeft: "0px",
                  marginRight: "0px",
                  marginTop: 32,
                  marginBottom: 32,
                  width: "100%",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "#D1D5DB",
                }}
              />
              <Section>
                <Row>
                  <Column style={{ verticalAlign: "baseline" }}>
                    <Img
                      alt={String(item?.props?.iconAlt ?? "")}
                      height="48"
                      src={String(item?.props?.iconSrc ?? "")}
                      width="48"
                    />
                  </Column>
                  <Column style={{ width: "85%" }}>
                    <Text
                      style={{
                        margin: "0px",
                        fontSize: 20,
                        fontWeight: 600,
                        lineHeight: "28px",
                        color: "#111827",
                      }}
                    >
                      {String(item?.props?.title ?? "")}
                    </Text>
                    <Text
                      style={{
                        margin: "0px",
                        marginTop: 8,
                        fontSize: 16,
                        lineHeight: "24px",
                        color: "#6B7280",
                      }}
                    >
                      {String(item?.props?.description ?? "")}
                    </Text>
                  </Column>
                </Row>
              </Section>
            </div>
          ))}
        </Section>
      </Section>
    );
  },
});
