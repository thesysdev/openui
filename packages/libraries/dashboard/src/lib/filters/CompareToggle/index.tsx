"use client";
import {
  defineComponent,
  useIsStreaming,
  useStateField,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import { CompareToggle, type CompareToggleProps } from "../../../components/filters/CompareToggle";
import { options } from "../../../components/filters/options";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { compareTogglePropsSchema, type CompareToggleSchemaProps } from "./schema";
export const CompareToggleComponent = defineComponent({
  name: "CompareToggle",
  props: compareTogglePropsSchema,
  description:
    'Compare dropdown: None, or one of options (e.g. [{value: "prev", label: "Previous 30 days"}, {value: "yoy", label: "Same 30 days last year"}]). The choice overlays the previous data on every chart that has it (dashed lines, ghost bars, funnel markers) and names it in legends and deltas. With options, pass name, and as value a $variable that holds the chosen option\'s value, or "off" for None ($compare = "off"); key each chart\'s previous data by it (prev[$compare]), so each choice shows its own data. Starts at None; defaultOn starts on the first choice. Without options, one choice named by label (default "Previous period").',
  component: CompareToggleView,
});
function CompareToggleView({ props }: ComponentRenderProps<CompareToggleSchemaProps>) {
  const streaming = useIsStreaming();
  const field = useStateField(props.name ?? "compare", props.value);
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

// Every schema field reaches CompareToggle (name binds the $variable here).
export type CompareToggleSchemaCovered = Covered<
  SchemaCoverage<CompareToggleSchemaProps, CompareToggleProps, "name">
>;
