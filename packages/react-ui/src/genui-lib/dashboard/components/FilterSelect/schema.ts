import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { FilterOptionComponent } from "./FilterOption";

// Options are FilterOption(value, label) child components (positional-only
// authoring). The renderers' `normalizeOptions` still accepts the legacy raw
// `[{value, label}]` shape at runtime, but the schema — what the LLM sees —
// only advertises the child-component form.
export const filterSelectPropsSchema = z.object({
  name: z.string(),
  label: z.string(),
  options: z.array(FilterOptionComponent.ref).default([]),
  defaultValue: reactive(z.string().optional()),
  placeholder: z.string().optional(),
});

export const filterMultiSelectPropsSchema = z.object({
  name: z.string(),
  label: z.string(),
  options: z.array(FilterOptionComponent.ref).default([]),
  defaultValues: reactive(z.array(z.string()).optional()),
  placeholder: z.string().optional(),
});

export type FilterSelectProps = z.infer<typeof filterSelectPropsSchema>;
export type FilterMultiSelectProps = z.infer<typeof filterMultiSelectPropsSchema>;
