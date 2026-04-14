"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Button, Hr, Text } from "@react-email/components";
import { z } from "zod/v4";
import { EmailPricingFeature } from "./PricingFeature";

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
    subNote: z.string().optional(),
  }),
  description:
    "Pricing card with badge, price, description, feature list, CTA button, and optional note. Great for upgrade and promotional emails.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const features = (props.features ?? []) as any[];
    const bg = (props.buttonColor as string) ?? "#4F46E5";
    const period = (props.period as string) ?? "/ month";

    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#D1D5DB",
          borderRadius: "12px",
          borderStyle: "solid",
          borderWidth: "1px",
          color: "#4B5563",
          padding: "28px",
          textAlign: "left",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {props.badge && (
          <Text
            style={{
              color: "#4F46E5",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.025em",
              lineHeight: "20px",
              marginBottom: "16px",
              marginTop: "0px",
              textTransform: "uppercase" as const,
            }}
          >
            {props.badge as string}
          </Text>
        )}
        <Text
          style={{
            fontSize: "30px",
            fontWeight: 700,
            lineHeight: "36px",
            marginBottom: "12px",
            marginTop: "0px",
          }}
        >
          <span style={{ color: "#101828" }}>{props.price as string}</span>{" "}
          <span style={{ fontSize: "16px", fontWeight: 500, lineHeight: "20px" }}>{period}</span>
        </Text>
        <Text
          style={{
            color: "#374151",
            fontSize: "14px",
            lineHeight: "20px",
            marginBottom: "24px",
            marginTop: "16px",
          }}
        >
          {props.description as string}
        </Text>
        <ul
          style={{
            color: "#6B7280",
            fontSize: "14px",
            lineHeight: "24px",
            marginBottom: "32px",
            paddingLeft: "14px",
          }}
        >
          {features.map((feat, i) => (
            <li key={i} style={{ marginBottom: "12px", position: "relative" }}>
              <span style={{ position: "relative" }}>{String(feat?.props?.text ?? "")}</span>
            </li>
          ))}
        </ul>
        <Button
          href={props.buttonHref as string}
          style={{
            backgroundColor: bg,
            borderRadius: "8px",
            boxSizing: "border-box",
            color: "#ffffff",
            display: "inline-block",
            fontSize: "16px",
            fontWeight: 700,
            letterSpacing: "0.025em",
            lineHeight: "24px",
            marginBottom: "24px",
            maxWidth: "100%",
            padding: "14px",
            textAlign: "center",
            width: "100%",
          }}
        >
          {props.buttonLabel as string}
        </Button>
        {(props.note || props.subNote) && (
          <>
            <Hr />
            {props.note && (
              <Text
                style={{
                  color: "#6B7280",
                  fontSize: "12px",
                  fontStyle: "italic",
                  lineHeight: "16px",
                  marginBottom: "6px",
                  marginTop: "24px",
                  textAlign: "center",
                }}
              >
                {props.note as string}
              </Text>
            )}
            {props.subNote && (
              <Text
                style={{
                  color: "#6B7280",
                  fontSize: "12px",
                  lineHeight: "16px",
                  margin: "0px",
                  textAlign: "center",
                }}
              >
                {props.subNote as string}
              </Text>
            )}
          </>
        )}
      </div>
    );
  },
});
