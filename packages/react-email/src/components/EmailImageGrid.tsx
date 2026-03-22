"use client";

import { Column, Img, Row, Section, Text } from "@react-email/components";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { EmailImage } from "./EmailImage";

export const EmailImageGrid = defineComponent({
  name: "EmailImageGrid",
  props: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    images: z.array(EmailImage.ref),
  }),
  description:
    "2x2 image grid layout with optional header title and description. Pass up to 4 EmailImage items. Great for product galleries and portfolios.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const images = (props.images ?? []) as any[];

    return (
      <Section style={{ marginTop: 16, marginBottom: 16 }}>
        {(props.title || props.description) && (
          <Section style={{ marginTop: 42 }}>
            <Row>
              {props.title && (
                <Text
                  style={{
                    margin: "0px",
                    marginTop: 8,
                    fontSize: 24,
                    lineHeight: "32px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {props.title as string}
                </Text>
              )}
              {props.description && (
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
              )}
            </Row>
          </Section>
        )}
        <Section style={{ marginTop: 16 }}>
          {[0, 2].map((startIdx) => {
            const rowImages = images.slice(startIdx, startIdx + 2);
            if (rowImages.length === 0) return null;
            return (
              <Row key={startIdx} style={{ marginTop: startIdx > 0 ? 16 : 0 }}>
                {rowImages.map((img, i) => (
                  <Column
                    key={i}
                    style={{
                      width: "50%",
                      paddingRight: i === 0 ? 8 : 0,
                      paddingLeft: i === 1 ? 8 : 0,
                    }}
                  >
                    <Img
                      alt={String(img?.props?.alt ?? "")}
                      height={288}
                      src={String(img?.props?.src ?? "")}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        objectFit: "cover",
                      }}
                    />
                  </Column>
                ))}
              </Row>
            );
          })}
        </Section>
      </Section>
    );
  },
});
