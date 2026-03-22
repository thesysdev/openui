"use client";

import { Column, Img, Row, Section, Text } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { EmailFeatureItem } from "./EmailFeatureItem";

export const EmailFeatureGrid = defineComponent({
  name: "EmailFeatureGrid",
  props: z.object({
    title: z.string(),
    description: z.string(),
    items: z.array(EmailFeatureItem.ref),
  }),
  description:
    "2x2 feature grid with header title, description, and four feature items each with icon, title, and description.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.items ?? []) as any[];

    return (
      <Section style={{ marginTop: 16, marginBottom: 16 }}>
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
        {[0, 2].map((startIdx) => (
          <Row key={startIdx} style={{ marginTop: startIdx === 0 ? 16 : 32 }}>
            {items.slice(startIdx, startIdx + 2).map((item, i) => (
              <Column
                key={i}
                colSpan={1}
                style={{
                  width: "50%",
                  paddingRight: i === 0 ? 12 : 0,
                  paddingLeft: i === 1 ? 12 : 0,
                  verticalAlign: "baseline",
                }}
              >
                <Img
                  alt={String(item?.props?.iconAlt ?? "")}
                  height="48"
                  src={String(item?.props?.iconSrc ?? "")}
                  width="48"
                />
                <Text
                  style={{
                    margin: "0px",
                    marginTop: 16,
                    fontSize: 20,
                    lineHeight: "28px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {String(item?.props?.title ?? "")}
                </Text>
                <Text
                  style={{
                    marginBottom: "0px",
                    marginTop: 8,
                    fontSize: 16,
                    lineHeight: "24px",
                    color: "#6B7280",
                  }}
                >
                  {String(item?.props?.description ?? "")}
                </Text>
              </Column>
            ))}
          </Row>
        ))}
      </Section>
    );
  },
});
