"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const filterOptionPropsSchema = z.object({
  value: z.string(),
  label: z.string().optional(),
});

export type FilterOptionProps = z.infer<typeof filterOptionPropsSchema>;

/**
 * Positional child component for filter options — `FilterOption(value, label)`
 * replaces the raw `[{value, label}]` arrays FilterSelect/FilterMultiSelect
 * used to advertise. Data-only (renders nothing itself): the parent renderer
 * reads its props via `normalizeOptions`, which also still accepts the legacy
 * raw-object shape at runtime. Same `.ref` pattern as Select/SelectItem.
 */
export const FilterOptionComponent = defineComponent({
  name: "FilterOption",
  props: filterOptionPropsSchema,
  description:
    "One option inside FilterSelect or FilterMultiSelect: FilterOption(value, label). value is the machine value sent to queries; label is the human-readable text (defaults to value).",
  component: () => null,
});
