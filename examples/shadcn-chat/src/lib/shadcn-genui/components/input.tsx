"use client";

import { Input as ShadcnInput } from "@/components/ui/input";
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
import { z } from "zod";
import { rulesSchema } from "../rules";

const InputSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  type: z.enum(["text", "email", "password", "number", "url"]).optional(),
  rules: rulesSchema,
});

export const Input = defineComponent({
  name: "Input",
  props: InputSchema,
  description:
    'Text input field. type: "text" | "email" | "password" | "number" | "url". rules for validation.',
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStreaming, rules.length > 0]);

    return (
      <ShadcnInput
        name={fieldName}
        placeholder={props.placeholder}
        type={props.type ?? "text"}
        defaultValue={savedValue as string}
        onBlur={(e) => {
          const val = e.target.value;
          if (val !== savedValue) setFieldValue(formName, "Input", fieldName, val, true);
          if (rules.length > 0 && formValidation)
            formValidation.validateField(fieldName, val, rules);
        }}
        disabled={isStreaming}
      />
    );
  },
});
