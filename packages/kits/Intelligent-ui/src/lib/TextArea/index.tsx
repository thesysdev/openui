"use client";

import { TextArea as RCTextArea } from "@openuidev/react-components";
import { defineComponent, useStateField } from "@openuidev/react-lang";
import { Field } from "../../components/Field";
import { useFieldName, useFieldRules } from "../controlHelpers";
import { TextAreaSchema } from "./schema";

export * from "./schema";

export const TextArea = defineComponent({
  name: "TextArea",
  props: TextAreaSchema,
  description: "",
  component: ({ props, statementId }) => {
    const name = useFieldName(props.label, statementId);
    const field = useStateField(name, props.value);
    const rules = useFieldRules(name, props.rules, field.value);
    return (
      <Field label={props.label} required={rules.required} error={rules.error}>
        <RCTextArea
          rows={Math.min(20, Math.max(2, Math.round(props.rows ?? 3)))}
          value={String(field.value ?? "")}
          placeholder={props.placeholder}
          aria-label={props.label ? undefined : props.placeholder}
          aria-required={rules.required || undefined}
          aria-invalid={rules.error ? true : undefined}
          hasError={!!rules.error}
          onChange={(event) => {
            rules.clear();
            field.setValue(event.target.value);
          }}
          onBlur={rules.check}
        />
      </Field>
    );
  },
});
