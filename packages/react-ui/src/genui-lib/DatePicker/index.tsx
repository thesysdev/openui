"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormValidation,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import clsx from "clsx";
import React from "react";
import { DatePicker as OpenUIDatePicker } from "../../components/DatePicker";
import { DatePickerSchema } from "./schema";

export { DatePickerSchema } from "./schema";

export const DatePicker = defineComponent({
  name: "DatePicker",
  props: DatePickerSchema,
  description:
    'A date field with a calendar inside a FormControl: DatePicker(name, mode?, rules?, value?, variant?), e.g. DatePicker("travel-dates", "range", { required: true }). mode "single" (default) picks one date; "range" picks a start and end, for trips, bookings or report periods. value binds a $variable. variant "inline" is borderless until hover or focus, for table cells and dense rows; use "default" everywhere else.',
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const field = useStateField(props.name, props.value);
    const mode = (props.mode as "single" | "range") || "single";
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const hasRules = rules.length > 0;

    React.useEffect(() => {
      if (!isStreaming && hasRules && formValidation) {
        formValidation.registerField(field.name, rules, () => field.value);
        return () => formValidation.unregisterField(field.name);
      }
      return undefined;
    }, [field.name, field.value, formValidation, hasRules, isStreaming, rules]);

    const handleChange = (val: unknown) => {
      field.setValue(val);
      if (hasRules) {
        formValidation?.validateField(field.name, val, rules);
      }
    };

    const className = clsx("openui-genui-date-picker", {
      "openui-genui-date-picker--inline": props.variant === "inline",
    });

    if (mode === "range") {
      return (
        <OpenUIDatePicker
          className={className}
          mode="range"
          selectedRangeDates={field.value as any}
          setSelectedRangeDates={handleChange}
        />
      );
    }

    return (
      <OpenUIDatePicker
        className={className}
        mode="single"
        selectedSingleDate={field.value as any}
        setSelectedSingleDate={handleChange}
      />
    );
  },
});
