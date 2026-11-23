"use client";

import { library } from "@openuidev/intelligent-ui-library";
import {
  defineComponent,
  parseStructuredRules,
  useFormValidation,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import { DatePicker as DateField } from "@openuidev/react-ui";
import { useEffect, useId, useMemo, useState } from "react";

// Keep calendar dates as YYYY-MM-DD strings and close after a date is picked.
// The schema matches Intelligent UI; the calendar stays in the chat's React UI theme.
const toDate = (value: unknown) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : undefined;
const toIsoDate = (date?: Date) =>
  date
    ? [date.getFullYear(), date.getMonth() + 1, date.getDate()]
        .map((part) => String(part).padStart(2, "0"))
        .join("-")
    : "";

export const DatePicker = defineComponent({
  name: "DatePicker",
  props: library.components.DatePicker.props,
  description:
    "A single date. Prefill it by passing a YYYY-MM-DD string as value; the form submits YYYY-MM-DD. min and max bound the available dates.",
  component: ({ props, statementId }) => {
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();
    const id = useId();
    const field = useStateField(statementId ?? id, props.value);
    const rules = useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const [isOpen, setIsOpen] = useState(false);
    const [rangeError, setRangeError] = useState<string>();

    useEffect(() => {
      if (isStreaming || !rules.length || !formValidation) return;
      formValidation.registerField(field.name, rules, () => field.value);
      return () => formValidation.unregisterField(field.name);
    }, [field.name, field.value, formValidation, isStreaming, rules]);

    return (
      <div>
        <label>
          {props.label}
          <DateField
            mode="single"
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            selectedSingleDate={toDate(field.value)}
            setSelectedSingleDate={(date) => {
              const value = toIsoDate(date);
              if ((props.min && value < props.min) || (props.max && value > props.max)) {
                setRangeError(
                  `Choose a date${props.min ? ` on or after ${props.min}` : ""}${props.max ? ` on or before ${props.max}` : ""}.`,
                );
                return;
              }
              setRangeError(undefined);
              field.setValue(value);
              setIsOpen(false);
              if (rules.length) formValidation?.validateField(field.name, value, rules);
            }}
          />
        </label>
        {(rangeError || formValidation?.errors[field.name]) && (
          <div role="alert">{rangeError || formValidation?.errors[field.name]}</div>
        )}
      </div>
    );
  },
});
