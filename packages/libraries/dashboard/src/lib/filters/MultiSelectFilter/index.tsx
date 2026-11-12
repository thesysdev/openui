"use client";
import {
  defineComponent,
  useIsStreaming,
  useStateField,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import {
  MultiSelectFilter,
  type MultiSelectFilterProps,
} from "../../../components/filters/MultiSelectFilter";
import { options } from "../../../components/filters/options";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { multiSelectFilterPropsSchema, type MultiSelectFilterSchemaProps } from "./schema";
export const MultiSelectFilterComponent = defineComponent({
  name: "MultiSelectFilter",
  props: multiSelectFilterPropsSchema,
  description:
    "Dropdown with checkboxes. value takes the $variable that holds an array of the selected options' values ($plans = [], and [] means all). For live data, pass that $variable into query arguments; with data written into the program, use ChipFilter or SelectFilter.",
  component: MultiSelectFilterView,
});
function MultiSelectFilterView({ props }: ComponentRenderProps<MultiSelectFilterSchemaProps>) {
  const streaming = useIsStreaming();
  const field = useStateField(props.name, props.value);
  return (
    <MultiSelectFilter
      {...props}
      value={field.value}
      onChange={field.setValue}
      streaming={streaming}
      options={options(props.options)}
    />
  );
}

// Every schema field reaches MultiSelectFilter.
export type MultiSelectFilterSchemaCovered = Covered<
  SchemaCoverage<MultiSelectFilterSchemaProps, MultiSelectFilterProps>
>;
