"use client";
import { defineComponent, useIsStreaming, type ComponentRenderProps } from "@openuidev/react-lang";
import { CompareToggle, type CompareToggleProps } from "../../../components/filters/CompareToggle";
import { options } from "../../../components/filters/options";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { useFilterField } from "../useFilterField";
import { compareTogglePropsSchema, type CompareToggleSchemaProps } from "./schema";
export const CompareToggleComponent = defineComponent({
  name: "CompareToggle",
  props: compareTogglePropsSchema,
  description:
    'Only with previous values to show: add it when a Kpi, Series or other component is given previous, never without. Compare dropdown: None, or one of options (e.g. [{value: "prev", label: "Previous 30 days"}, {value: "yoy", label: "Same 30 days last year"}]). The choice overlays the previous data on every chart that has it (dashed lines, ghost bars, funnel markers) and names it in legends and deltas. With options, pass as value a $variable that holds the chosen option\'s value, or "off" for None ($compare = "off"); key each chart\'s previous data by it (prev[$compare]), so each choice shows its own data. Starts at None; defaultOn starts on the first choice. Without options, CompareToggle() is one choice named by label (default "Previous period").',
  component: CompareToggleView,
});
function CompareToggleView({ props }: ComponentRenderProps<CompareToggleSchemaProps>) {
  const streaming = useIsStreaming();
  const field = useFilterField(props.value, "compare");
  return (
    <CompareToggle
      {...props}
      value={field.value}
      onChange={field.setValue}
      streaming={streaming}
      options={options(props.options)}
    />
  );
}

// Every schema field reaches CompareToggle.
export type CompareToggleSchemaCovered = Covered<
  SchemaCoverage<CompareToggleSchemaProps, CompareToggleProps>
>;
