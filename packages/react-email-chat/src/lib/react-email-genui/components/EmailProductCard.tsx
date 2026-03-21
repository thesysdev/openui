"use client";

import { Button, Heading, Img, Section, Text } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const EmailProductCard = defineComponent({
  name: "EmailProductCard",
  props: z.object({
    imageSrc: z.string(),
    imageAlt: z.string(),
    category: z.string().optional(),
    title: z.string(),
    description: z.string(),
    price: z.string(),
    buttonLabel: z.string(),
    buttonHref: z.string(),
    buttonColor: z.string().optional(),
  }),
  description:
    "Product showcase card with hero image, optional category, title, description, price, and buy button.",
  component: ({ props }) => {
    const bg = (props.buttonColor as string) ?? "#4F46E5";
    return (
      <Section style={{ marginTop: 16, marginBottom: 16 }}>
        <Img
          alt={props.imageAlt as string}
          height="320"
          src={props.imageSrc as string}
          style={{ width: "100%", borderRadius: 12, objectFit: "cover" }}
        />
        <Section style={{ marginTop: 32, textAlign: "center" }}>
          {props.category && (
            <Text
              style={{
                marginTop: 16,
                fontSize: 18,
                lineHeight: "28px",
                fontWeight: 600,
                color: "#4F46E5",
              }}
            >
              {props.category as string}
            </Text>
          )}
          <Heading
            as="h1"
            style={{
              fontSize: 36,
              lineHeight: "40px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {props.title as string}
          </Heading>
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
          <Text
            style={{
              fontSize: 16,
              lineHeight: "24px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {props.price as string}
          </Text>
          <Button
            href={props.buttonHref as string}
            style={{
              marginTop: 16,
              borderRadius: 8,
              backgroundColor: bg,
              paddingLeft: 24,
              paddingRight: 24,
              paddingTop: 12,
              paddingBottom: 12,
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            {props.buttonLabel as string}
          </Button>
        </Section>
      </Section>
    );
  },
});
