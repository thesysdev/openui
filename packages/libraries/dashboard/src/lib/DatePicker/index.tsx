"use client";

import { DatePicker } from "@openuidev/react-components";
import {
  defineComponent,
  parseStructuredRules,
  useFormName,
  useFormValidation,
  useIsStreaming,
  useSetFieldValue,
  useStateField,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import React from "react";
import { DateField } from "../../components/DateField";
import { datePickerPropsSchema, type DatePickerProps } from "./schema";
function parseDate(str: string | undefined): Date | undefined {
  if (!str) return undefined;
  const parts = str.split("-");
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(d.getTime()) ? undefined : d;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
}

function formatDate(d: Date | undefined): string | undefined {
  if (!d) return undefined;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DatePickerRenderer({ props }: ComponentRenderProps<DatePickerProps>) {
  const formName = useFormName();
  const setFieldValue = useSetFieldValue();
  const isStreaming = useIsStreaming();
  const defaultDate = typeof props.defaultDate === "string" ? props.defaultDate : undefined;
  const field = useStateField(props.name, props.defaultDate);

  const fieldName = props.name;
  const mode = props.mode ?? "single";
  const storedValue = field.value as string | undefined;
  const [isOpen, setIsOpen] = React.useState(false);
  const lastSyncedRef = React.useRef<string>("");
  const pendingValueRef = React.useRef<string>("");
  const formValidation = useFormValidation();
  const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
  const hasRules = rules.length > 0;

  // Register the rules with the enclosing form, as react-ui's DatePicker does.
  React.useEffect(() => {
    if (!isStreaming && hasRules && formValidation) {
      formValidation.registerField(fieldName, rules, () => field.value);
      return () => formValidation.unregisterField(fieldName);
    }
    return undefined;
  }, [fieldName, field.value, formValidation, hasRules, isStreaming, rules]);

  const setValue = (val: string) => {
    field.setValue(val);
    if (hasRules) formValidation?.validateField(fieldName, val, rules);
  };

  const syncBinding = React.useCallback(
    (value: string) => {
      if (!field.isReactive && value && value !== lastSyncedRef.current) {
        lastSyncedRef.current = value;
        setFieldValue(formName, "DatePicker", `$${fieldName}`, value, false);
      }
    },
    [field.isReactive, formName, fieldName, setFieldValue],
  );

  if (mode === "range") {
    const parts = (storedValue ?? "").split(",");
    const rangeValue = {
      from: parseDate(parts[0]) ?? parseDate(defaultDate),
      to: parseDate(parts[1]),
    };
    return (
      <DateField label={props.label}>
        <DatePicker
          mode="range"
          selectedRangeDates={rangeValue}
          setSelectedRangeDates={(range) => {
            const from = formatDate(range?.from);
            const to = formatDate(range?.to);
            const val = [from, to].filter(Boolean).join(",");
            setValue(val);
            pendingValueRef.current = val;
          }}
          isOpen={isOpen && !isStreaming}
          setIsOpen={(open) => {
            setIsOpen(open);
            if (!open && pendingValueRef.current) {
              syncBinding(pendingValueRef.current);
            }
          }}
        />
      </DateField>
    );
  }

  return (
    <DateField label={props.label}>
      <DatePicker
        mode="single"
        selectedSingleDate={parseDate(storedValue) ?? parseDate(defaultDate)}
        setSelectedSingleDate={(date) => {
          const val = formatDate(date) ?? "";
          setValue(val);
          syncBinding(val);
          setIsOpen(false);
        }}
        isOpen={isOpen && !isStreaming}
        setIsOpen={setIsOpen}
      />
    </DateField>
  );
}

export const DatePickerComponent = defineComponent({
  name: "DatePicker",
  props: datePickerPropsSchema,
  description:
    "Date filter. rules {required: true} is checked when the picker sits in a form. label shows above the picker.",
  component: DatePickerRenderer,
});
