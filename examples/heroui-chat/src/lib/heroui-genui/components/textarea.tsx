"use client";

import { TextArea as HeroUITextArea } from "@heroui/react";
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

const TextAreaSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  rows: z.number().optional(),
  rules: rulesSchema,
});

function TextAreaRenderer({ props }: ComponentRenderProps<z.infer<typeof TextAreaSchema>>) {
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
    <HeroUITextArea
      name={fieldName}
      placeholder={props.placeholder ?? ""}
      rows={props.rows ?? 3}
      value={savedValue ?? ""}
      aria-invalid={!!error}
      data-invalid={error ? "true" : undefined}
      onChange={(e) => {
        setFieldValue(formName, "TextArea", fieldName, e.target.value, true);
      }}
      onFocus={() => formValidation?.clearFieldError(fieldName)}
      onBlur={() => {
        if (rules.length > 0) {
          formValidation?.validateField(fieldName, getFieldValue(formName, fieldName), rules);
        }
      }}
      disabled={isStreaming}
    />
  );
}

export const TextArea = defineComponent({
  name: "TextArea",
  props: TextAreaSchema,
  description: "Multiline text input",
  component: TextAreaRenderer,
});
