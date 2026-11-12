"use client";
import {
  defineComponent,
  useIsStreaming,
  useStateField,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import { ChipFilter, type ChipFilterProps } from "../../../components/filters/ChipFilter";
import { options } from "../../../components/filters/options";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { chipFilterPropsSchema, type ChipFilterSchemaProps } from "./schema";
export const ChipFilterComponent = defineComponent({
  name: "ChipFilter",
  props: chipFilterPropsSchema,
  description:
    "Pills for 2–6 segments; one is always selected. value takes the $variable that holds the selected option's value. In a FilterBar for a dashboard-wide segment, or in a Card's controls to switch that card's breakdown (leave label out there: the card title names it).",
  component: ChipFilterView,
});
function ChipFilterView({ props }: ComponentRenderProps<ChipFilterSchemaProps>) {
  const streaming = useIsStreaming();
  const field = useStateField(props.name, props.value);
  return (
    <ChipFilter
      {...props}
      value={field.value}
      onChange={field.setValue}
      streaming={streaming}
      options={options(props.options)}
    />
  );
}

// Every schema field reaches ChipFilter.
export type ChipFilterSchemaCovered = Covered<
  SchemaCoverage<ChipFilterSchemaProps, ChipFilterProps>
>;
