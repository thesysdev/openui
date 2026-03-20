"use client";

import { Button, Column, Heading, Row, Section, Text } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
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
          <Text
            style={{ fontSize: 16, lineHeight: "24px", color: "#374151" }}
          >
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
                      <Button
                        href={`#rating-${number}`}
                        style={{
                          height: 20,
                          width: 20,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderStyle: "solid",
                          borderColor: bg,
                          padding: 8,
                          fontWeight: 600,
                          color: bg,
                        }}
                      >
                        {number}
                      </Button>
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
