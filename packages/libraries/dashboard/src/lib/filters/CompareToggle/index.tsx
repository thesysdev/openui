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
    'Add one only when some component is given previous values. Compare dropdown: None, or one of options (e.g. [{value: "prev", label: "Previous 30 days"}, {value: "yoy", label: "Same 30 days last year"}]). The choice overlays the previous data on every chart that has it (dashed lines, ghost bars, funnel markers) and names it in legends and deltas. Without options it is one choice named by label (default "Previous period"), starting at None unless defaultOn is true: CompareToggle("Previous week", true). With options, value (the third argument) takes the $variable and defaultOn is ignored: the control shows the variable\'s value, an option\'s value or "off" for None, so declare the starting choice ($compare = "prev"; undeclared shows None). Key each chart\'s previous data by it (prev[$compare]), so each choice shows its own data.',
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
