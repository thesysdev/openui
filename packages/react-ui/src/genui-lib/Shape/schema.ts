import { z } from "zod/v4";

export const ShapeSchema = z.object({
  shape: z.enum([
    "circle",
    "square",
    "diamond",
    "triangle-up",
    "triangle-down",
    "triangle-left",
    "triangle-right",
    "hexagon",
  ]),
  color: z
    .enum(["neutral", "info", "success", "warning", "danger", "purple", "pink", "inverted"])
    .optional(),
  label: z.string().optional(),
});

export type ShapeProps = z.infer<typeof ShapeSchema>;
