"use client";

import { DatePicker as RCDatePicker } from "@openuidev/react-components";
import { defineComponent, useStateField } from "@openuidev/react-lang";
import { useState } from "react";
import { Field, useFieldName, useFieldRules } from "../controlHelpers";
import { DatePickerSchema } from "./schema";

export * from "./schema";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "YYYY-MM-DD" <-> Date in local time, because react-components' calendar
 * picks local midnight. Converting through UTC shifted the day: east of UTC a
 * pick saved the day before, west of UTC a stored date showed the day before.
 */
const toDate = (text: unknown): Date | undefined => {
  if (typeof text !== "string" || !DATE.test(text)) return undefined;
  const [y, m, d] = text.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 ? date : undefined; // rejects 2026-02-30
};

const toText = (date?: Date): string =>
  date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : "";

const spoken = (text: string) =>
  toDate(text)?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) ?? text;

/**
 * Why a date falls outside min..max, or undefined. react-components' calendar
 * cannot grey days out, so the kit refuses such a pick and says why.
 * "YYYY-MM-DD" strings compare in date order.
 */
const outOfRange = (text: string, min?: string, max?: string) => {
  if (!text) return undefined;
  if (min && DATE.test(min) && text < min) return `Choose ${spoken(min)} or later`;
  if (max && DATE.test(max) && text > max) return `Choose ${spoken(max)} or earlier`;
  return undefined;
};

export const DatePicker = defineComponent({
  name: "DatePicker",
  props: DatePickerSchema,
  description: 'Dates are "YYYY-MM-DD".',
  component: function DatePickerView({ props, statementId }) {
    const name = useFieldName(props.label, statementId);
    const field = useStateField(name, props.value);
    const rules = useFieldRules(name, props.rules, field.value);
    // react-components' DatePicker is a popover and owns no open state itself.
    const [isOpen, setIsOpen] = useState(false);
    const [rangeError, setRangeError] = useState<string>();
    return (
      <Field label={props.label} required={rules.required} error={rangeError ?? rules.error}>
        <RCDatePicker
          mode="single"
          selectedSingleDate={toDate(field.value)}
          setSelectedSingleDate={(date?: Date) => {
            const text = toText(date);
            const problem = outOfRange(text, props.min, props.max);
            setRangeError(problem);
            if (problem) return;
            rules.clear();
            field.setValue(text);
          }}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
      </Field>
    );
  },
});
