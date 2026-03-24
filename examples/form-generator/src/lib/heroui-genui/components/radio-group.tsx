"use client";

import {
  Description,
  Label,
  Radio,
  RadioGroup as HeroUIRadioGroup,
} from "@heroui/react";
import {
  type ComponentRenderProps,
  defineComponent,
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

const RadioItemSchema = z.object({
  label: z.string(),
  description: z.string(),
  value: z.string(),
});

export const RadioItem = defineComponent({
  name: "RadioItem",
  props: RadioItemSchema,
  description: "Option for RadioGroup",
  component: () => null,
});

const RadioGroupSchema = z.object({
  name: z.string(),
  items: z.array(RadioItem.ref),
  defaultValue: z.string().optional(),
  rules: rulesSchema,
});

function RadioGroupRenderer({ props }: ComponentRenderProps<z.infer<typeof RadioGroupSchema>>) {
  const formName = useFormName();
  const getFieldValue = useGetFieldValue();
  const setFieldValue = useSetFieldValue();
  const isStreaming = useIsStreaming();
  const formValidation = useFormValidation();

  const fieldName = props.name;
  const rules = useMemo(() => parseStructuredRules(props.rules), [props.rules]);
  const items = props.items ?? [];
  const value = (getFieldValue(formName, fieldName) ?? props.defaultValue) as string | undefined;

  useEffect(() => {
    if (!isStreaming && props.defaultValue != null && getFieldValue(formName, fieldName) == null) {
      setFieldValue(formName, "RadioGroup", fieldName, props.defaultValue, false);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming && rules.length > 0 && formValidation) {
      formValidation.registerField(fieldName, rules, () => getFieldValue(formName, fieldName));
      return () => formValidation.unregisterField(fieldName);
    }
    return undefined;
  }, [isStreaming, rules.length > 0]);

  if (!items.length) return null;

  return (
    <HeroUIRadioGroup
      name={fieldName}
      value={value ?? ""}
      onChange={(val) => {
        setFieldValue(formName, "RadioGroup", fieldName, val, true);
        if (rules.length > 0) {
          formValidation?.validateField(fieldName, val, rules);
        }
      }}
      isDisabled={isStreaming}
    >
      {items.map((item, i) => (
        <Radio key={i} value={item.props.value}>
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          <Radio.Content>
            <Label>{item.props.label}</Label>
            {item.props.description && (
              <Description>{item.props.description}</Description>
            )}
          </Radio.Content>
        </Radio>
      ))}
    </HeroUIRadioGroup>
  );
}

export const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: RadioGroupSchema,
  description: "Radio button group",
  component: RadioGroupRenderer,
});
