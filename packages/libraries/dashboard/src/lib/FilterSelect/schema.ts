import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
export const filterSelectPropsSchema = z.object({
  name: z.string(),
  label: z.string(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string().optional(),
      }),
    )
    .default([]),
  defaultValue: reactive(z.string().optional()),
  placeholder: z.string().optional(),
});

export const filterMultiSelectPropsSchema = z.object({
  name: z.string(),
  label: z.string(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string().optional(),
      }),
    )
    .default([]),
  defaultValues: reactive(z.array(z.string()).optional()),
  placeholder: z.string().optional(),
});

export type FilterSelectProps = z.infer<typeof filterSelectPropsSchema>;
export type FilterMultiSelectProps = z.infer<typeof filterMultiSelectPropsSchema>;
