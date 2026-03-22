"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const isDark = () =>
  typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false;

const SIZE_STYLES: Record<string, { fontSize: string; fontWeight: string }> = {
  small: { fontSize: "13px", fontWeight: "400" },
  default: { fontSize: "15px", fontWeight: "400" },
  large: { fontSize: "18px", fontWeight: "400" },
  "small-heavy": { fontSize: "13px", fontWeight: "600" },
  "large-heavy": { fontSize: "18px", fontWeight: "600" },
};

export const TextContent = defineComponent({
  name: "TextContent",
  props: z.object({
    text: z.string(),
    size: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
  }),
  description:
    'Text block. Optional size: "small" | "default" | "large" | "small-heavy" | "large-heavy".',
  component: ({ props }) => {
    const size = (props.size as string) ?? "default";
    const sizeStyle = SIZE_STYLES[size] ?? SIZE_STYLES["default"];
    const dark = isDark();

    return (
      <p
        style={{
          margin: 0,
          color: dark ? "#e0e0e0" : "#1a1a1a",
          fontSize: sizeStyle.fontSize,
          fontWeight: sizeStyle.fontWeight,
          lineHeight: "1.5",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {String(props.text ?? "")}
      </p>
    );
  },
});
