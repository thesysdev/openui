"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Column, Img, Row } from "@react-email/components";
import { z } from "zod";
import { EmailAvatar } from "./Avatar";

export const EmailAvatarGroup = defineComponent({
  name: "EmailAvatarGroup",
  props: z.object({
    avatars: z.array(EmailAvatar.ref),
  }),
  description:
    "Overlapping stacked avatar group. Pass EmailAvatar items to display them in a horizontal row with negative offset overlap.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const avatars = (props.avatars ?? []) as any[];

    return (
      <Row
        style={{
          borderCollapse: "collapse",
          borderSpacing: 0,
        }}
      >
        {avatars.map((avatar, i) => {
          const src = String(avatar?.props?.src ?? "");
          const alt = String(avatar?.props?.alt ?? "");
          const size = Number(avatar?.props?.size ?? 44);

          return (
            <Column
              key={i}
              width={String(size)}
              style={{
                height: size,
                width: size,
                padding: 0,
                textAlign: "center",
                verticalAlign: "middle",
                lineHeight: "0px",
                position: "relative",
                left: i > 0 ? -(i * 12) : 0,
              }}
            >
              <div
                style={{
                  boxSizing: "border-box",
                  height: "100%",
                  width: "100%",
                  overflow: "hidden",
                  borderRadius: "9999px",
                  border: "4px solid #ffffff",
                  backgroundColor: "#1F2937",
                }}
              >
                <Img
                  src={src}
                  alt={alt}
                  width={size - 8}
                  height={size - 8}
                  style={{
                    display: "inline-block",
                    height: "100%",
                    width: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
              </div>
            </Column>
          );
        })}
      </Row>
    );
  },
});
