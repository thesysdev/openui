"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormName,
  useFormValidation,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/lang-react";
import React from "react";
import { TextArea as OpenUITextArea } from "../../components/TextArea";
import { TextAreaSchema } from "./schema";

export { TextAreaSchema } from "./schema";

export const TextArea = defineComponent({
  name: "TextArea",
  props: TextAreaSchema,
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
      <OpenUITextArea
        name={fieldName}
        placeholder={(props.placeholder as string) || ""}
        rows={(props.rows as number) || 3}
        defaultValue={savedValue}
        onFocus={() => formValidation?.clearFieldError(fieldName)}
        onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
          const val = e.target.value;
          if (val !== savedValue) {
            setFieldValue(formName, "TextArea", fieldName, val, true);
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
