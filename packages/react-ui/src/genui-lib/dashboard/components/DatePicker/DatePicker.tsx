"use client";

import {
  defineComponent,
  useFormName,
  useIsStreaming,
  useSetFieldValue,
  useStateField,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import React from "react";
import { DatePicker } from "../../../../components/DatePicker";
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
  const field = useStateField(props.name, defaultDate);

  const fieldName = props.name;
  const mode = props.mode ?? "single";
  const storedValue = field.value as string | undefined;
  const [isOpen, setIsOpen] = React.useState(false);
  const lastSyncedRef = React.useRef<string>("");
  const pendingValueRef = React.useRef<string>("");

  const syncBinding = React.useCallback(
    (value: string) => {
      if (value && value !== lastSyncedRef.current) {
        lastSyncedRef.current = value;
        setFieldValue(formName, "DatePicker", `$${fieldName}`, value, false);
      }
    },
    [formName, fieldName, setFieldValue],
  );

  if (mode === "range") {
    const parts = (storedValue ?? "").split(",");
    const rangeValue = {
      from: parseDate(parts[0]) ?? parseDate(defaultDate),
      to: parseDate(parts[1]),
    };
    return (
      <DatePicker
        mode="range"
        selectedRangeDates={rangeValue}
        setSelectedRangeDates={(range) => {
          const from = formatDate(range?.from);
          const to = formatDate(range?.to);
          const val = [from, to].filter(Boolean).join(",");
          field.setValue(val);
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
    );
  }

  return (
    <DatePicker
      mode="single"
      selectedSingleDate={parseDate(storedValue) ?? parseDate(defaultDate)}
      setSelectedSingleDate={(date) => {
        const val = formatDate(date) ?? "";
        field.setValue(val);
        syncBinding(val);
        setIsOpen(false);
      }}
      isOpen={isOpen && !isStreaming}
      setIsOpen={setIsOpen}
    />
  );
}

export const DatePickerComponent = defineComponent({
  name: "DatePicker",
  props: datePickerPropsSchema,
  description: "",
  component: DatePickerRenderer,
});
