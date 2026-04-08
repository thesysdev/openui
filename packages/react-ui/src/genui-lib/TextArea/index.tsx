"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormValidation,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import React from "react";
import { TextArea as OpenUITextArea } from "../../components/TextArea";
import { TextAreaSchema } from "./schema";

export { TextAreaSchema } from "./schema";

export const TextArea = defineComponent({
  name: "TextArea",
  props: TextAreaSchema,
  description: "",
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const field = useStateField(props.name, props.value);
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const hasRules = rules.length > 0;

    React.useEffect(() => {
      if (!isStreaming && hasRules && formValidation) {
        formValidation.registerField(field.name, rules, () => field.value);
        return () => formValidation.unregisterField(field.name);
      }
      return undefined;
    }, [field.name, field.value, formValidation, hasRules, isStreaming, rules]);

    return (
      <OpenUITextArea
        name={field.name}
        placeholder={(props.placeholder as string) || ""}
        rows={(props.rows as number) || 3}
        value={field.value ?? ""}
        onFocus={() => formValidation?.clearFieldError(field.name)}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const val = e.target.value;
          field.setValue(val);
          if (hasRules) {
            formValidation?.clearFieldError(field.name);
          }
        }}
        onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
          if (hasRules) {
            formValidation?.validateField(field.name, e.target.value, rules);
          }
        }}
        disabled={isStreaming}
      />
    );
  },
});
