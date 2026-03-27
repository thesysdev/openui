"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Column, Row } from "@react-email/components";
import { z } from "zod";
import { EmailStatItem } from "./StatItem";

export const EmailStats = defineComponent({
  name: "EmailStats",
  props: z.object({
    items: z.array(EmailStatItem.ref),
  }),
  description:
    "Horizontal stats row displaying key metrics. Each stat has a large value and a label below it.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.items ?? []) as any[];

    return (
      <Row>
        {items.map((item, i) => (
          <Column key={i}>
            <p
              style={{
                margin: 0,
                textAlign: "left",
                fontSize: 18,
                lineHeight: "24px",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "#111827",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {String(item?.props?.value ?? "")}
            </p>
            <p
              style={{
                margin: 0,
                textAlign: "left",
                fontSize: 12,
                lineHeight: "18px",
                color: "#6B7280",
              }}
            >
              {String(item?.props?.label ?? "")}
            </p>
          </Column>
        ))}
      </Row>
    );
  },
});
