"use client";

import {
  Select as RCSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openuidev/react-components";
import { defineComponent, useStateField } from "@openuidev/react-lang";
import { Field, optionList, useFieldName, useFieldRules } from "../controlHelpers";
import { SelectSchema } from "./schema";

export * from "./schema";

export const Select = defineComponent({
  name: "Select",
  props: SelectSchema,
  description: "Dropdown, for long option lists.",
  component: ({ props, statementId }) => {
    const name = useFieldName(props.label, statementId);
    const field = useStateField(name, props.value);
    const value = field.value == null ? "" : String(field.value);
    const rules = useFieldRules(name, props.rules, value);
    return (
      <Field label={props.label} required={rules.required} error={rules.error}>
        <RCSelect
          value={value || undefined}
          onValueChange={(next: string) => {
            // Radix emits "" only from the hidden native <select> it adds inside
            // a <form>, never from a choice, so "" must not wipe the value.
            if (!next) return;
            rules.clear();
            field.setValue(next);
          }}
        >
          {/* Select sizes are "sm" | "md" | "lg", not Input's "small" | "medium" | "large". */}
          <SelectTrigger
            size="lg"
            aria-label={props.label ? undefined : props.placeholder}
            aria-required={rules.required || undefined}
            aria-invalid={rules.error ? true : undefined}
          >
            <SelectValue placeholder={props.placeholder ?? "Choose…"} />
          </SelectTrigger>
          <SelectContent>
            {optionList(props.options).map((o, i) => (
              <SelectItem key={`${o.value}-${i}`} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </RCSelect>
      </Field>
    );
  },
});
