"use client";
import { defineComponent, useIsStreaming, type ComponentRenderProps } from "@openuidev/react-lang";
import { ChipFilter, type ChipFilterProps } from "../../../components/filters/ChipFilter";
import { options } from "../../../components/filters/options";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { useFilterField } from "../useFilterField";
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
  const field = useFilterField(props.value, `chip:${props.label ?? ""}`);
  return (
    <ChipFilter
      {...props}
      name={field.name}
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
