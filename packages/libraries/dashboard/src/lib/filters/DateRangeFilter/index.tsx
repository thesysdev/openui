"use client";
import {
  defineComponent,
  useIsStreaming,
  useStateField,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import {
  DateRangeFilter,
  type DateRangeFilterProps,
} from "../../../components/filters/DateRangeFilter";
import { options } from "../../../components/filters/options";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { dateRangeFilterPropsSchema, type DateRangeFilterSchemaProps } from "./schema";
export const DateRangeFilterComponent = defineComponent({
  name: "DateRangeFilter",
  props: dateRangeFilterPropsSchema,
  description:
    'Dropdown with presets (default 7d, 30d, 90d, 12m, ytd) and a calendar for a custom range; the value is a preset key or "2026-10-01..2026-10-31". For live data, pass its $variable into query arguments; with data written into the program, use PeriodPicker.',
  component: DateRangeFilterView,
});
function DateRangeFilterView({ props }: ComponentRenderProps<DateRangeFilterSchemaProps>) {
  const streaming = useIsStreaming();
  const field = useStateField(props.name, props.value);
  return (
    <DateRangeFilter
      {...props}
      value={field.value}
      onChange={field.setValue}
      streaming={streaming}
      presets={options(props.presets)}
    />
  );
}

// Every schema field reaches DateRangeFilter (name binds the $variable here).
export type DateRangeFilterSchemaCovered = Covered<
  SchemaCoverage<DateRangeFilterSchemaProps, DateRangeFilterProps, "name">
>;
