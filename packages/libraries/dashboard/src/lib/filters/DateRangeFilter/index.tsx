"use client";
import { defineComponent, useIsStreaming, type ComponentRenderProps } from "@openuidev/react-lang";
import {
  DateRangeFilter,
  type DateRangeFilterProps,
} from "../../../components/filters/DateRangeFilter";
import { options } from "../../../components/filters/options";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { useFilterField } from "../useFilterField";
import { dateRangeFilterPropsSchema, type DateRangeFilterSchemaProps } from "./schema";
export const DateRangeFilterComponent = defineComponent({
  name: "DateRangeFilter",
  props: dateRangeFilterPropsSchema,
  description:
    'Dropdown of preset options (default 7d, 30d, 90d, 12m, ytd) and a calendar for a custom range; value takes the $variable that holds the selection: a preset key ("30d") or a custom range "2026-10-01..2026-10-31". For live data, pass that $variable into query arguments; with data written into the program, use PeriodPicker.',
  component: DateRangeFilterView,
});
function DateRangeFilterView({ props }: ComponentRenderProps<DateRangeFilterSchemaProps>) {
  const streaming = useIsStreaming();
  const field = useFilterField(props.value, "dateRange", props.label, props.options);
  return (
    <DateRangeFilter
      {...props}
      value={field.value}
      onChange={field.setValue}
      streaming={streaming}
      options={options(props.options)}
    />
  );
}

// Every schema field reaches DateRangeFilter.
export type DateRangeFilterSchemaCovered = Covered<
  SchemaCoverage<DateRangeFilterSchemaProps, DateRangeFilterProps>
>;
