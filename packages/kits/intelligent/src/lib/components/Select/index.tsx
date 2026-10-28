"use client";

import {
  Select as RCSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openuidev/react-components";
import { defineComponent, useStateField } from "@openuidev/react-lang";
import { Field, optionList, useFieldName } from "../controlHelpers";
import { SelectSchema } from "./schema";

export * from "./schema";

export const Select = defineComponent({
  name: "Select",
  props: SelectSchema,
  description: "Dropdown, for long option lists.",
  component: ({ props, statementId }) => {
    const field = useStateField(useFieldName(props.label, statementId), props.value);
    const value = field.value == null ? "" : String(field.value);
    return (
      <Field label={props.label}>
        <RCSelect value={value || undefined} onValueChange={(next: string) => field.setValue(next)}>
          {/* Select sizes are "sm" | "md" | "lg", not Input's "small" | "medium" | "large". */}
          <SelectTrigger size="lg" aria-label={props.label ? undefined : props.placeholder}>
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
