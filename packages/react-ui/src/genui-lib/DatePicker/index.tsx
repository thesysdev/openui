"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormName,
  useFormValidation,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/react-lang";
import React from "react";
import { DatePicker as OpenUIDatePicker } from "../../components/DatePicker";
import { DatePickerSchema } from "./schema";

export { DatePickerSchema } from "./schema";

export const DatePicker = defineComponent({
  name: "DatePicker",
  props: DatePickerSchema,
  description: "",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const fieldName = (props.name as string) || "date";
    const mode = (props.mode as "single" | "range") || "single";
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const value = getFieldValue(formName, fieldName);

    React.useEffect(() => {
      if (!isStreaming && rules.length > 0 && formValidation) {
        formValidation.registerField(fieldName, rules, () => getFieldValue(formName, fieldName));
        return () => formValidation.unregisterField(fieldName);
      }
      return undefined;
    }, [isStreaming, rules.length > 0]);

    const handleChange = (val: unknown) => {
      setFieldValue(formName, "DatePicker", fieldName, val, true);
      if (rules.length > 0) {
        formValidation?.validateField(fieldName, val, rules);
      }
    };

    if (mode === "range") {
      return (
        <OpenUIDatePicker
          mode="range"
          selectedRangeDates={value}
          setSelectedRangeDates={handleChange}
        />
      );
    }

    return (
      <OpenUIDatePicker
        mode="single"
        selectedSingleDate={value}
        setSelectedSingleDate={handleChange}
      />
    );
  },
});
