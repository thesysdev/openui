"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormValidation,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import { DatePicker as DateField } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useEffect, useMemo, useState } from "react";

// React UI's DatePicker stores Date objects: the model cannot prefill one, and a submitted
// date reaches the model as a UTC timestamp that can fall on the day before. This version
// keeps the same props, reads and writes calendar dates as YYYY-MM-DD strings, and closes
// once a date is picked.
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
  props: openuiLibrary.components.DatePicker.props,
  description:
    "A single date. Prefill it by passing a YYYY-MM-DD string as value; the form submits YYYY-MM-DD.",
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();
    const field = useStateField(props.name, props.value);
    const rules = useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
      if (isStreaming || !rules.length || !formValidation) return;
      formValidation.registerField(field.name, rules, () => field.value);
      return () => formValidation.unregisterField(field.name);
    }, [field.name, field.value, formValidation, isStreaming, rules]);

    return (
      <DateField
        mode="single"
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        selectedSingleDate={toDate(field.value)}
        setSelectedSingleDate={(date) => {
          const value = toIsoDate(date);
          field.setValue(value);
          setIsOpen(false);
          if (rules.length) formValidation?.validateField(field.name, value, rules);
        }}
      />
    );
  },
});
