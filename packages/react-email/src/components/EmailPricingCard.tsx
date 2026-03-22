"use client";

import { Button, Hr, Section, Text } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { EmailPricingFeature } from "./EmailPricingFeature";

export const EmailPricingCard = defineComponent({
  name: "EmailPricingCard",
  props: z.object({
    badge: z.string().optional(),
    price: z.string(),
    period: z.string().optional(),
    description: z.string(),
    features: z.array(EmailPricingFeature.ref),
    buttonLabel: z.string(),
    buttonHref: z.string(),
    buttonColor: z.string().optional(),
    note: z.string().optional(),
  }),
  description:
    "Pricing card with badge, price, description, feature list, CTA button, and optional note. Great for upgrade and promotional emails.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const features = (props.features ?? []) as any[];
    const bg = (props.buttonColor as string) ?? "#4F46E5";
    const period = (props.period as string) ?? "/ month";

    return (
      <Section
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#D1D5DB",
          borderRadius: 12,
          borderStyle: "solid",
          borderWidth: 1,
          color: "#4B5563",
          padding: 28,
          textAlign: "left",
          width: "100%",
        }}
      >
        {props.badge && (
          <Text
            style={{
              color: "#4F46E5",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.025em",
              lineHeight: "20px",
              marginBottom: 16,
              textTransform: "uppercase" as const,
            }}
          >
            {props.badge as string}
          </Text>
        )}
        <Text
          style={{
            fontSize: 30,
            fontWeight: 700,
            lineHeight: "36px",
            marginBottom: 12,
            marginTop: "0px",
          }}
        >
          <span style={{ color: "#101828" }}>{props.price as string}</span>{" "}
          <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "20px" }}>
            {period}
          </span>
        </Text>
        <Text
          style={{
            color: "#374151",
            fontSize: 14,
            lineHeight: "20px",
            marginTop: 16,
            marginBottom: 24,
          }}
        >
          {props.description as string}
        </Text>
        <ul
          style={{
            color: "#6B7280",
            fontSize: 14,
            lineHeight: "24px",
            marginBottom: 32,
            paddingLeft: 14,
          }}
        >
          {features.map((feat, i) => (
            <li key={i} style={{ marginBottom: 12, position: "relative" }}>
              <span style={{ position: "relative" }}>
                {String(feat?.props?.text ?? "")}
              </span>
            </li>
          ))}
        </ul>
        <Button
          href={props.buttonHref as string}
          style={{
            backgroundColor: bg,
            borderRadius: 8,
            boxSizing: "border-box",
            color: "#ffffff",
            display: "inline-block",
            fontSize: 16,
            lineHeight: "24px",
            fontWeight: 700,
            letterSpacing: "0.025em",
            marginBottom: 24,
            maxWidth: "100%",
            padding: 14,
            textAlign: "center",
            width: "100%",
          }}
        >
          {props.buttonLabel as string}
        </Button>
        {props.note && (
          <>
            <Hr />
            <Text
              style={{
                color: "#6B7280",
                fontSize: 12,
                lineHeight: "16px",
                fontStyle: "italic",
                marginTop: 24,
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              {props.note as string}
            </Text>
          </>
        )}
      </Section>
    );
  },
});
