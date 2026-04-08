"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormValidation,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import React from "react";
import { Input as OpenUIInput } from "../../components/Input";
import { InputSchema } from "./schema";

export { InputSchema } from "./schema";

export const Input = defineComponent({
  name: "Input",
  props: InputSchema,
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
      <OpenUIInput
        id={field.name}
        name={field.name}
        placeholder={(props.placeholder as string) || ""}
        type={(props.type as string) || "text"}
        value={field.value ?? ""}
        onFocus={() => formValidation?.clearFieldError(field.name)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const val = e.target.value;
          field.setValue(val);
          if (hasRules) {
            formValidation?.clearFieldError(field.name);
          }
        }}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
          if (hasRules) {
            formValidation?.validateField(field.name, e.target.value, rules);
          }
        }}
        disabled={isStreaming}
      />
    );
  },
});
