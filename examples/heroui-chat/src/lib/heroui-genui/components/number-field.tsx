"use client";

import { Label, NumberField as HeroUINumberField } from "@heroui/react";
import {
  type ComponentRenderProps,
  defineComponent,
  parseRules,
  parseStructuredRules,
  useFormName,
  useFormValidation,
  useGetFieldValue,
  useIsStreaming,
  useSetDefaultValue,
  useSetFieldValue,
} from "@openuidev/react-lang";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { rulesSchema } from "../rules";

const NumberFieldSchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  defaultValue: z.number().optional(),
  rules: rulesSchema,
});

function NumberFieldRenderer({ props }: ComponentRenderProps<z.infer<typeof NumberFieldSchema>>) {
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
  const existingValue = getFieldValue(formName, fieldName);
  const error = formValidation?.errors[fieldName];

  useSetDefaultValue({
    formName,
    componentType: "NumberField",
    name: fieldName,
    existingValue,
    defaultValue: props.defaultValue,
  });

  useEffect(() => {
    if (!isStreaming && rules.length > 0 && formValidation) {
      formValidation.registerField(fieldName, rules, () =>
        getFieldValue(formName, fieldName),
      );
      return () => formValidation.unregisterField(fieldName);
    }
    return undefined;
  }, [isStreaming, rules.length > 0, formValidation, fieldName, formName]);

  const value = existingValue ?? props.defaultValue;

  return (
    <HeroUINumberField
      value={value != null ? value : undefined}
      minValue={props.min}
      maxValue={props.max}
      step={props.step}
      isDisabled={isStreaming}
      isInvalid={!!error}
      onChange={(val) => {
        setFieldValue(formName, "NumberField", fieldName, val, true);
        if (rules.length > 0) {
          formValidation?.validateField(fieldName, val, rules);
        }
      }}
    >
      <Label>{props.label ?? fieldName}</Label>
      <HeroUINumberField.Group>
        <HeroUINumberField.DecrementButton />
        <HeroUINumberField.Input />
        <HeroUINumberField.IncrementButton />
      </HeroUINumberField.Group>
    </HeroUINumberField>
  );
}

export const NumberField = defineComponent({
  name: "NumberField",
  props: NumberFieldSchema,
  description: "Numeric input with increment/decrement buttons",
  component: NumberFieldRenderer,
});
