"use client";

import Typography from "@mui/material/Typography";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const TextContentSchema = z.object({
  text: z.string(),
  size: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
});

type Cfg = { variant: "body1" | "body2" | "h6"; fontWeight: number; color?: string };

const sizeMap: Record<string, Cfg> = {
  small: { variant: "body2", fontWeight: 400, color: "text.secondary" },
  default: { variant: "body1", fontWeight: 400 },
  large: { variant: "h6", fontWeight: 400 },
  "small-heavy": { variant: "body2", fontWeight: 600 },
  "large-heavy": { variant: "h6", fontWeight: 600 },
};

export const TextContent = defineComponent({
  name: "TextContent",
  props: TextContentSchema,
  description:
    'Text block with optional size. size: "small" | "default" | "large" | "small-heavy" | "large-heavy".',
  component: ({ props }) => {
    const text = props.text == null ? "" : String(props.text);
    const cfg = sizeMap[props.size ?? "default"] ?? sizeMap.default;
    return (
      <Typography variant={cfg.variant} sx={{ fontWeight: cfg.fontWeight, color: cfg.color }}>
        {text}
      </Typography>
    );
  },
});
