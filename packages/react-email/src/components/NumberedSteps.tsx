"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Column, Hr, Row, Section, Text } from "@react-email/components";
import { z } from "zod";
import { EmailStepItem } from "./StepItem";

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
        </Section>
        {steps.map((step, index) => (
          <Section key={index}>
            <Hr
              style={{
                border: "1px solid #D1D5DB",
                margin: 0,
                width: "100%",
              }}
            />
            <Section style={{ paddingTop: 24, paddingBottom: 24 }}>
              <Row>
                <Column width="48" style={{ width: 48, paddingRight: 12, verticalAlign: "top" }}>
                  <div
                    style={{
                      backgroundColor: "#C7D2FE",
                      borderRadius: "9999px",
                      color: "#4F46E5",
                      fontWeight: 700,
                      height: 36,
                      width: 36,
                      fontSize: 14,
                      lineHeight: "36px",
                      textAlign: "center" as const,
                      display: "inline-block",
                    }}
                  >
                    {index + 1}
                  </div>
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
          </Section>
        ))}
      </Section>
    );
  },
});
