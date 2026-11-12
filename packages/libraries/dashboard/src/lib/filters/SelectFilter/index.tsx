"use client";
import {
  defineComponent,
  useIsStreaming,
  useStateField,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import { options } from "../../../components/filters/options";
import { SelectFilter, type SelectFilterProps } from "../../../components/filters/SelectFilter";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { selectFilterPropsSchema, type SelectFilterSchemaProps } from "./schema";
export const SelectFilterComponent = defineComponent({
  name: "SelectFilter",
  props: selectFilterPropsSchema,
  description:
    "Dropdown for one value out of a longer list. value takes the $variable that holds the selected option's value. In a FilterBar for a dashboard-wide segment, or in a Card's controls to switch that card's breakdown.",
  component: SelectFilterView,
});
function SelectFilterView({ props }: ComponentRenderProps<SelectFilterSchemaProps>) {
  const streaming = useIsStreaming();
  const field = useStateField(props.name, props.value);
  return (
    <SelectFilter
      {...props}
      value={field.value}
      onChange={field.setValue}
      streaming={streaming}
      options={options(props.options)}
    />
  );
}

// Every schema field reaches SelectFilter.
export type SelectFilterSchemaCovered = Covered<
  SchemaCoverage<SelectFilterSchemaProps, SelectFilterProps>
>;
