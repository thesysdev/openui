"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Column, Heading, Row, Section, Text } from "@react-email/components";
import { z } from "zod";

export const EmailSurveyRating = defineComponent({
  name: "EmailSurveyRating",
  props: z.object({
    question: z.string(),
    description: z.string().optional(),
    buttonColor: z.string().optional(),
  }),
  description:
    "Rating survey section with a question and 1-5 numbered buttons. Great for feedback and NPS emails.",
  component: ({ props }) => {
    const bg = (props.buttonColor as string) ?? "#4F46E5";

    return (
      <Section style={{ textAlign: "center", paddingTop: 16, paddingBottom: 16 }}>
        <Text
          style={{
            marginTop: 8,
            marginBottom: 8,
            fontSize: 18,
            lineHeight: "28px",
            fontWeight: 600,
            color: "#4F46E5",
          }}
        >
          Your opinion matters
        </Text>
        <Heading
          as="h1"
          style={{
            margin: "0px",
            marginTop: 8,
            fontSize: 30,
            lineHeight: "36px",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          {props.question as string}
        </Heading>
        {props.description && (
          <Text style={{ fontSize: 16, lineHeight: "24px", color: "#374151" }}>
            {props.description as string}
          </Text>
        )}
        <Row>
          <Column align="center">
            <table>
              <tbody>
                <tr>
                  {[1, 2, 3, 4, 5].map((number) => (
                    <td align="center" key={number} style={{ padding: 4 }}>
                      <a
                        href={`#rating-${number}`}
                        style={{
                          display: "inline-block",
                          height: 40,
                          width: 40,
                          borderRadius: 8,
                          border: `1px solid ${bg}`,
                          fontSize: 16,
                          fontWeight: 600,
                          color: bg,
                          textDecoration: "none",
                          lineHeight: "40px",
                          textAlign: "center",
                        }}
                      >
                        {number}
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </Column>
        </Row>
      </Section>
    );
  },
});
