"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Img } from "@react-email/components";
import { z } from "zod/v4";

export const EmailAvatar = defineComponent({
  name: "EmailAvatar",
  props: z.object({
    src: z.string(),
    alt: z.string(),
    size: z.number().optional(),
    rounded: z.enum(["full", "md"]).optional(),
  }),
  description:
    "Avatar image component. Supports circular (rounded='full') or rounded-square (rounded='md') shapes, and configurable size.",
  component: ({ props }) => {
    const size = (props.size as number) ?? 42;
    const rounded = (props.rounded as string) ?? "full";
    const borderRadius = rounded === "full" ? "9999px" : "8px";

    return (
      <div
        style={{
          display: "inline-block",
          width: size,
          height: size,
          borderRadius,
          overflow: "hidden",
          backgroundColor: "#1F2937",
        }}
      >
        <Img
          src={props.src as string}
          alt={props.alt as string}
          width={size}
          height={size}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </div>
    );
  },
});
