import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const datePickerPropsSchema = z.object({
  name: z.string(),
  mode: z.enum(["single", "range"]).default("single"),
  rules: z
    .object({
      required: z.boolean().optional(),
    })
    .optional(),
  defaultDate: reactive(z.string().optional()),
});

// Use a manual type that treats defaultDate as string for the renderer
export type DatePickerProps = {
  name: string;
  mode: "single" | "range";
  rules?: { required?: boolean };
  defaultDate: any;
};
