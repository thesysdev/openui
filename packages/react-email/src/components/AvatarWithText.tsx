"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Column, Img, Link, Row } from "@react-email/components";
import { z } from "zod/v4";

export const EmailAvatarWithText = defineComponent({
  name: "EmailAvatarWithText",
  props: z.object({
    avatarSrc: z.string(),
    avatarAlt: z.string(),
    name: z.string(),
    role: z.string(),
    href: z.string().optional(),
  }),
  description:
    "Avatar with name and role text beside it. Optionally wraps in a link. Great for author attribution or team member display.",
  component: ({ props }) => {
    const content = (
      <Row
        style={{
          width: "auto",
          tableLayout: "fixed",
          borderCollapse: "collapse",
          borderSpacing: 0,
        }}
      >
        <Column
          style={{
            height: 44,
            width: 44,
            overflow: "hidden",
            borderRadius: "9999px",
            padding: 0,
            textAlign: "center",
            verticalAlign: "middle",
            lineHeight: "0px",
          }}
        >
          <Img
            src={props.avatarSrc as string}
            width={36}
            height={36}
            alt={props.avatarAlt as string}
            style={{
              height: "100%",
              width: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        </Column>
        <Column
          style={{
            paddingLeft: 12,
            fontSize: 14,
            lineHeight: "20px",
            fontWeight: 500,
            color: "#6B7280",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#374151",
              fontWeight: 600,
            }}
          >
            {props.name as string}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: "14px",
            }}
          >
            {props.role as string}
          </p>
        </Column>
      </Row>
    );

    if (props.href) {
      return (
        <Row>
          <Column align="center">
            <Link href={props.href as string} style={{ textDecoration: "none", color: "inherit" }}>
              {content}
            </Link>
          </Column>
        </Row>
      );
    }

    return (
      <Row>
        <Column align="center">{content}</Column>
      </Row>
    );
  },
});
