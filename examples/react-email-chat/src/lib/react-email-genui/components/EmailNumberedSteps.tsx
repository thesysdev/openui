"use client";

import { Column, Hr, Row, Section, Text } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { EmailStepItem } from "./EmailStepItem";

export const EmailNumberedSteps = defineComponent({
  name: "EmailNumberedSteps",
  props: z.object({
    title: z.string(),
    description: z.string(),
    steps: z.array(EmailStepItem.ref),
  }),
  description:
    "Numbered steps list with header title, description, and sequential step items. Each step shows a numbered badge, title, and description.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const steps = (props.steps ?? []) as any[];

    return (
      <Section style={{ marginTop: 16 }}>
        <Section style={{ paddingBottom: 24 }}>
          <Row>
            <Text
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: 24,
                color: "#111827",
                lineHeight: "32px",
              }}
            >
              {props.title as string}
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 16,
                color: "#6B7280",
                lineHeight: "24px",
              }}
            >
              {props.description as string}
            </Text>
          </Row>
        </Section>
        {steps.map((step, index) => (
          <div key={index}>
            <Hr
              style={{
                border: "1px solid #D1D5DB",
                margin: 0,
                width: "100%",
              }}
            />
            <Section style={{ paddingTop: 24, paddingBottom: 24 }}>
              <Row>
                <Column
                  width="48"
                  height="40"
                  style={{ width: 40, height: 40, paddingRight: 8 }}
                  valign="baseline"
                >
                  <Row width="40" align="left">
                    <Column
                      align="center"
                      height="40"
                      style={{
                        backgroundColor: "#C7D2FE",
                        borderRadius: "9999px",
                        color: "#4F46E5",
                        fontWeight: 600,
                        height: 40,
                        padding: 0,
                        width: 40,
                      }}
                      valign="middle"
                      width="40"
                    >
                      {index + 1}
                    </Column>
                  </Row>
                </Column>
                <Column width="100%" style={{ width: "100%" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: 20,
                      lineHeight: "28px",
                      color: "#111827",
                    }}
                  >
                    {String(step?.props?.title ?? "")}
                  </Text>
                  <Text
                    style={{
                      margin: 0,
                      paddingTop: 8,
                      fontSize: 16,
                      lineHeight: "24px",
                      color: "#6B7280",
                    }}
                  >
                    {String(step?.props?.description ?? "")}
                  </Text>
                </Column>
              </Row>
            </Section>
          </div>
        ))}
      </Section>
    );
  },
});
