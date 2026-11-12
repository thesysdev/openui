"use client";
import {
  defineComponent,
  useIsStreaming,
  useStateField,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import { options } from "../../../components/filters/options";
import { PeriodPicker, type PeriodPickerProps } from "../../../components/filters/PeriodPicker";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { periodPickerPropsSchema, type PeriodPickerSchemaProps } from "./schema";
export const PeriodPickerComponent = defineComponent({
  name: "PeriodPicker",
  props: periodPickerPropsSchema,
  description:
    'Segmented control for a few date presets, e.g. [{value: "7d", label: "7D"}, {value: "30d", label: "30D"}]. value takes the $variable that holds the selected option\'s value ($period = "30d"). Pass that $variable into query arguments (live data), or key written-in data by it.',
  component: PeriodPickerView,
});
function PeriodPickerView({ props }: ComponentRenderProps<PeriodPickerSchemaProps>) {
  const streaming = useIsStreaming();
  const field = useStateField(props.name, props.value);
  return (
    <PeriodPicker
      {...props}
      value={field.value}
      onChange={field.setValue}
      streaming={streaming}
      options={options(props.options)}
    />
  );
}

// Every schema field reaches PeriodPicker (name binds the $variable here).
export type PeriodPickerSchemaCovered = Covered<
  SchemaCoverage<PeriodPickerSchemaProps, PeriodPickerProps, "name">
>;
