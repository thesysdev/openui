"use client";

import { Input as RCInput } from "@openuidev/react-components";
import { defineComponent, useStateField } from "@openuidev/react-lang";
import { useState } from "react";
import { Field } from "../../components/Field";
import { useFieldName, useFieldRules } from "../controlHelpers";
import { InputSchema } from "./schema";

export * from "./schema";

export const Input = defineComponent({
  name: "Input",
  props: InputSchema,
  description: "Text or number field; a number field stores numbers.",
  component: function InputView({ props, statementId }) {
    const name = useFieldName(props.label, statementId);
    const field = useStateField(name, props.value);
    const rules = useFieldRules(name, props.rules, field.value);
    const numeric = props.type === "number";
    // A number field shows what is typed ("1." or "-") until it parses.
    const [draft, setDraft] = useState<string | null>(null);
    return (
      <Field label={props.label} required={rules.required} error={rules.error}>
        <RCInput
          // "large" lines the field up with DatePicker's trigger (42px); the
          // default "medium" is 36px, which left the controls uneven.
          size="large"
          type="text"
          inputMode={numeric ? "decimal" : undefined}
          value={draft ?? String(field.value ?? "")}
          placeholder={props.placeholder}
          aria-label={props.label ? undefined : props.placeholder}
          aria-required={rules.required || undefined}
          aria-invalid={rules.error ? true : undefined}
          hasError={!!rules.error}
          onChange={(event) => {
            rules.clear();
            const text = event.target.value;
            if (!numeric) return field.setValue(text);
            setDraft(text);
            const parsed = Number(text.replace(/,/g, ""));
            // An emptied number field holds null -- neither 0 nor "" -- so a program can
            // tell "empty" from zero. The schema types the value string | number,
            // and widening it would change the prompt, hence the cast.
            if (text.trim() === "") field.setValue(null as unknown as number);
            else if (Number.isFinite(parsed)) field.setValue(parsed);
          }}
          onBlur={() => {
            setDraft(null);
            rules.check();
          }}
        />
      </Field>
    );
  },
});
