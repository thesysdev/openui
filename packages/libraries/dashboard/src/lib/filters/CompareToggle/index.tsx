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
    'Add one only when something it switches is given previous values: a Series, a Trend, a Funnel, a Goal, a Flow, or a Donut, SegmentedBar or Treemap. The change printed on a Kpi, Stat, Leaderboard or GeoMap shows without it, so previous values on those alone need no toggle. Compare dropdown: None, or one of options (e.g. [{value: "prev", label: "Previous 30 days"}, {value: "yoy", label: "Same 30 days last year"}]). The choice overlays the previous data on every chart that has it (dashed lines, ghost bars, funnel markers) and names it in legends and deltas. Without options it is one choice named by label (default "Previous period"): CompareToggle("Previous week", true). Starts at None; defaultOn starts on the first choice. value, the third argument, takes the $variable, and is only needed with options: it holds the chosen option\'s value, or "off" for None ($compare = "off"); key each chart\'s previous data by it (prev[$compare]), so each choice shows its own data.',
  component: CompareToggleView,
});
function CompareToggleView({ props }: ComponentRenderProps<CompareToggleSchemaProps>) {
  const streaming = useIsStreaming();
  const field = useFilterField(props.value, "compare", props.label, props.options);
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
