"use client";

import { Column, Heading, Row, Section, Text } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { EmailListItem } from "./EmailListItem";

export const EmailList = defineComponent({
  name: "EmailList",
  props: z.object({
    title: z.string().optional(),
    items: z.array(EmailListItem.ref),
  }),
  description:
    "Numbered list with circular number badges and item title + description. Pass EmailListItem children. Great for feature lists, how-it-works sections, and top-N lists.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.items ?? []) as any[];

    return (
      <Section>
        {props.title && (
          <Heading
            as="h2"
            style={{
              marginBottom: 42,
              textAlign: "center",
              fontSize: 24,
              lineHeight: "32px",
              color: "#111827",
            }}
          >
            {props.title as string}
          </Heading>
        )}
        {items.map((item, i) => {
          const title = String(item?.props?.title ?? "");
          const description = String(item?.props?.description ?? "");
          const number = i + 1;

          return (
            <Section key={i} style={{ marginBottom: 36 }}>
              <Row style={{ paddingRight: 32, paddingLeft: 12 }}>
                <Column
                  width="24"
                  valign="top"
                  style={{
                    paddingRight: 18,
                    height: 24,
                    width: 24,
                  }}
                >
                  <Row>
                    <Column
                      align="center"
                      valign="middle"
                      width="24"
                      style={{
                        height: 24,
                        width: 24,
                        borderRadius: "9999px",
                        backgroundColor: "#4F46E5",
                        fontWeight: 600,
                        color: "#ffffff",
                        fontSize: 12,
                        lineHeight: "24px",
                        textAlign: "center",
                      }}
                    >
                      {number}
                    </Column>
                  </Row>
                </Column>
                <Column valign="top">
                  <Heading
                    as="h3"
                    style={{
                      marginTop: 0,
                      marginBottom: 8,
                      color: "#111827",
                      fontSize: 18,
                      lineHeight: "28px",
                    }}
                  >
                    {title}
                  </Heading>
                  <Text
                    style={{
                      margin: 0,
                      color: "#6B7280",
                      fontSize: 14,
                      lineHeight: "24px",
                    }}
                  >
                    {description}
                  </Text>
                </Column>
              </Row>
            </Section>
          );
        })}
      </Section>
    );
  },
});
