"use client";

import { DatePicker as RCDatePicker } from "@openuidev/react-components";
import { defineComponent, useStateField } from "@openuidev/react-lang";
import { useState } from "react";
import { Field, useFieldName } from "../controlHelpers";
import { DatePickerSchema } from "./schema";

export * from "./schema";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" <-> Date, in UTC so a timezone never shifts the day. */
const toDate = (text: unknown): Date | undefined => {
  if (typeof text !== "string" || !DATE.test(text)) return undefined;
  const parsed = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};
const toText = (date?: Date): string => (date ? date.toISOString().slice(0, 10) : "");

export const DatePicker = defineComponent({
  name: "DatePicker",
  props: DatePickerSchema,
  description: 'Dates are "YYYY-MM-DD".',
  component: function DatePickerView({ props, statementId }) {
    const field = useStateField(useFieldName(props.label, statementId), props.value);
    // react-components' DatePicker is a popover and owns no open state itself.
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Field label={props.label}>
        <RCDatePicker
          mode="single"
          selectedSingleDate={toDate(field.value)}
          setSelectedSingleDate={(date?: Date) => field.setValue(toText(date))}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
      </Field>
    );
  },
});
