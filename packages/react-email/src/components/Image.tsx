"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Img } from "@react-email/components";
import { z } from "zod/v4";

export const EmailImage = defineComponent({
  name: "EmailImage",
  props: z.object({
    src: z.string(),
    alt: z.string(),
    width: z.number().optional(),
  }),
  description: "Email image. Use real, publicly accessible URLs.",
  component: ({ props }) => (
    <Img
      src={props.src as string}
      alt={props.alt as string}
      width={((props.width as number) ?? 600).toString()}
      style={{
        maxWidth: "100%",
        height: "auto",
        margin: "0 0 16px 0",
        borderRadius: "4px",
      }}
    />
  ),
});
