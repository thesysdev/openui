"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Button, Column, Heading, Hr, Row, Section, Text } from "@react-email/components";
import { z } from "zod";

export const EmailCustomerReview = defineComponent({
  name: "EmailCustomerReview",
  props: z.object({
    title: z.string().optional(),
    totalReviews: z.number(),
    rating5: z.number(),
    rating4: z.number(),
    rating3: z.number(),
    rating2: z.number(),
    rating1: z.number(),
    buttonLabel: z.string().optional(),
    buttonHref: z.string().optional(),
    buttonColor: z.string().optional(),
  }),
  description:
    "Customer review summary with star rating distribution bars showing percentages for each rating (1-5). Includes total review count and optional CTA button to write a review.",
  component: ({ props }) => {
    const title = (props.title as string) ?? "Customer Reviews";
    const totalReviews = props.totalReviews as number;
    const ratings = [
      { rating: 5, count: props.rating5 as number },
      { rating: 4, count: props.rating4 as number },
      { rating: 3, count: props.rating3 as number },
      { rating: 2, count: props.rating2 as number },
      { rating: 1, count: props.rating1 as number },
    ];
    const buttonLabel = (props.buttonLabel as string) ?? "Write a review";
    const buttonHref = (props.buttonHref as string) ?? "#";
    const buttonColor = (props.buttonColor as string) ?? "#4F46E5";

    return (
      <Section>
        <Heading as="h2" style={{ fontSize: 24, lineHeight: "32px", color: "#111827" }}>
          {title}
        </Heading>
        <Section style={{ marginTop: 24, marginBottom: 24 }}>
          {ratings.map(({ rating, count }) => {
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            const filledPct =
              totalReviews > 0 ? `${Math.round((count / totalReviews) * 100)}%` : "0%";

            return (
              <Row
                key={rating}
                style={{
                  fontSize: 14,
                  lineHeight: "20px",
                  marginBottom: 4,
                }}
              >
                <Column
                  width="24"
                  style={{
                    width: 24,
                    fontWeight: 500,
                    color: "#6B7280",
                    textAlign: "right",
                    paddingRight: 8,
                  }}
                >
                  {rating}
                </Column>
                <Column valign="middle" style={{ paddingLeft: 4 }}>
                  <div
                    style={{
                      width: "100%",
                      height: 12,
                      backgroundColor: "#F3F4F6",
                      borderRadius: 6,
                      border: "1px solid #E5E7EB",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: filledPct,
                        height: "100%",
                        backgroundColor: buttonColor,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                </Column>
                <Column
                  width="48"
                  style={{
                    width: 48,
                    paddingLeft: 12,
                    fontWeight: 500,
                    color: "#6B7280",
                    fontSize: 12,
                  }}
                >
                  {pct}%
                </Column>
              </Row>
            );
          })}
          <Text
            style={{
              marginTop: 14,
              textAlign: "center",
              color: "#6B7280",
              fontSize: 12,
              lineHeight: "24px",
            }}
          >
            Based on <span style={{ fontWeight: 600 }}>{totalReviews}</span> Reviews
          </Text>
        </Section>
        <Hr style={{ borderColor: "#E5E7EB" }} />
        <Section style={{ marginTop: 30 }}>
          <Heading
            as="h3"
            style={{
              marginBottom: 12,
              fontWeight: 500,
              color: "#111827",
              fontSize: 18,
              lineHeight: "24px",
            }}
          >
            Share your thoughts
          </Heading>
          <Text
            style={{
              margin: 0,
              color: "#6B7280",
              fontSize: 14,
              lineHeight: "20px",
            }}
          >
            If you&apos;ve used this product, share your thoughts with other customers
          </Text>
          <Button
            href={buttonHref}
            style={{
              marginTop: 26,
              marginBottom: 24,
              display: "inline-block",
              width: "100%",
              borderRadius: 8,
              backgroundColor: buttonColor,
              padding: 12,
              textAlign: "center",
              boxSizing: "border-box",
              fontWeight: 600,
              color: "#ffffff",
              fontSize: 14,
            }}
          >
            {buttonLabel}
          </Button>
        </Section>
      </Section>
    );
  },
});
