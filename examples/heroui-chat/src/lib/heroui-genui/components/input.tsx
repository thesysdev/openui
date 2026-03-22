"use client";

import { Input as HeroUIInput } from "@heroui/react";
import {
  type ComponentRenderProps,
  defineComponent,
  parseRules,
  parseStructuredRules,
  useFormName,
  useFormValidation,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/react-lang";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { rulesSchema } from "../rules";

const InputSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  type: z.enum(["text", "email", "password", "number", "url"]).optional(),
  rules: rulesSchema,
});

function InputRenderer({ props }: ComponentRenderProps<z.infer<typeof InputSchema>>) {
  const formName = useFormName();
  const getFieldValue = useGetFieldValue();
  const setFieldValue = useSetFieldValue();
  const isStreaming = useIsStreaming();
  const formValidation = useFormValidation();

  const fieldName = props.name;
  const rules = useMemo(() => {
    const r = props.rules;
    if (Array.isArray(r)) return parseRules(r);
    return parseStructuredRules(r);
  }, [props.rules]);
  const savedValue = getFieldValue(formName, fieldName) ?? "";
  const error = formValidation?.errors[fieldName];

  useEffect(() => {
    if (!isStreaming && rules.length > 0 && formValidation) {
      formValidation.registerField(fieldName, rules, () =>
        getFieldValue(formName, fieldName),
      );
      return () => formValidation.unregisterField(fieldName);
    }
    return undefined;
  }, [isStreaming, rules.length > 0, formValidation, fieldName, formName]);

  return (
    <HeroUIInput
      id={fieldName}
      name={fieldName}
      placeholder={props.placeholder ?? ""}
      type={props.type ?? "text"}
      value={savedValue ?? ""}
      isInvalid={!!error}
      onChange={(e) => {
        setFieldValue(formName, "Input", fieldName, e.target.value, true);
      }}
      onFocus={() => formValidation?.clearFieldError(fieldName)}
      onBlur={() => {
        if (rules.length > 0) {
          formValidation?.validateField(
            fieldName,
            getFieldValue(formName, fieldName),
            rules,
          );
        }
      }}
      disabled={isStreaming}
    />
  );
}

export const Input = defineComponent({
  name: "Input",
  props: InputSchema,
  description: "Single-line text input",
  component: InputRenderer,
});
