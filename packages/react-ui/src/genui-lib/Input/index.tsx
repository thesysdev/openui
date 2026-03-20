"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormName,
  useFormValidation,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
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
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const fieldName = props.name as string;
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const savedValue = getFieldValue(formName, fieldName) ?? "";

    React.useEffect(() => {
      if (!isStreaming && rules.length > 0 && formValidation) {
        formValidation.registerField(fieldName, rules, () => getFieldValue(formName, fieldName));
        return () => formValidation.unregisterField(fieldName);
      }
      return undefined;
    }, [isStreaming, rules.length > 0]);

    return (
      <OpenUIInput
        id={fieldName}
        name={fieldName}
        placeholder={(props.placeholder as string) || ""}
        type={(props.type as string) || "text"}
        defaultValue={savedValue}
        onFocus={() => formValidation?.clearFieldError(fieldName)}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
          const val = e.target.value;
          if (val !== savedValue) {
            setFieldValue(formName, "Input", fieldName, val, true);
          }
          if (rules.length > 0) {
            formValidation?.validateField(fieldName, val, rules);
          }
        }}
        disabled={isStreaming}
      />
    );
  },
});
