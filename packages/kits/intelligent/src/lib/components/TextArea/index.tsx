"use client";

import { TextArea as RCTextArea } from "@openuidev/react-components";
import { defineComponent, useStateField } from "@openuidev/react-lang";
import { Field, useFieldName } from "../controlHelpers";
import { TextAreaSchema } from "./schema";

export * from "./schema";

export const TextArea = defineComponent({
  name: "TextArea",
  props: TextAreaSchema,
  description: "",
  component: ({ props, statementId }) => {
    const field = useStateField(useFieldName(props.label, statementId), props.value);
    return (
      <Field label={props.label}>
        <RCTextArea
          rows={Math.min(20, Math.max(2, Math.round(props.rows ?? 3)))}
          value={String(field.value ?? "")}
          placeholder={props.placeholder}
          aria-label={props.label ? undefined : props.placeholder}
          onChange={(event) => field.setValue(event.target.value)}
        />
      </Field>
    );
  },
});
