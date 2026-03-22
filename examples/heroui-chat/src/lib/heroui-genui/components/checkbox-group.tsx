"use client";

import {
  Checkbox,
  CheckboxGroup as HeroUICheckboxGroup,
  Description,
  Label,
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
import { useCallback, useEffect, useMemo } from "react";
import { z } from "zod";
import { rulesSchema } from "../rules";

const CheckBoxItemSchema = z.object({
  label: z.string(),
  description: z.string(),
  name: z.string(),
  defaultChecked: z.boolean().optional(),
});

export const CheckBoxItem = defineComponent({
  name: "CheckBoxItem",
  props: CheckBoxItemSchema,
  description: "Option for CheckBoxGroup",
  component: () => null,
});

const CheckBoxGroupSchema = z.object({
  name: z.string(),
  items: z.array(CheckBoxItem.ref),
  rules: rulesSchema,
});

function CheckBoxGroupRenderer({
  props,
}: ComponentRenderProps<z.infer<typeof CheckBoxGroupSchema>>) {
  const formName = useFormName();
  const getFieldValue = useGetFieldValue();
  const setFieldValue = useSetFieldValue();
  const isStreaming = useIsStreaming();
  const formValidation = useFormValidation();

  const fieldName = props.name;
  const rules = useMemo(() => parseStructuredRules(props.rules), [props.rules]);
  const items = props.items ?? [];

  const getAggregate = useCallback((): Record<string, boolean> => {
    const stored = getFieldValue(formName, fieldName) as Record<string, boolean> | undefined;
    const result: Record<string, boolean> = {};
    for (const item of items) {
      result[item.props.name] = stored?.[item.props.name] ?? item.props.defaultChecked ?? false;
    }
    return result;
  }, [formName, fieldName, items, getFieldValue]);

  useEffect(() => {
    if (!isStreaming && items.length > 0 && getFieldValue(formName, fieldName) == null) {
      const initial: Record<string, boolean> = {};
      for (const item of items) {
        initial[item.props.name] = item.props.defaultChecked ?? false;
      }
      setFieldValue(formName, "CheckBoxGroup", fieldName, initial, false);
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

  const aggregate = getAggregate();
  const selectedValues = items
    .filter((item) => aggregate[item.props.name])
    .map((item) => item.props.name);

  return (
    <HeroUICheckboxGroup
      value={selectedValues}
      onChange={(newValues) => {
        const newAggregate: Record<string, boolean> = {};
        for (const item of items) {
          newAggregate[item.props.name] = newValues.includes(item.props.name);
        }
        setFieldValue(formName, "CheckBoxGroup", fieldName, newAggregate, true);
        if (rules.length > 0) {
          formValidation?.validateField(fieldName, newAggregate, rules);
        }
      }}
      isDisabled={isStreaming}
    >
      {items.map((item, i) => (
        <Checkbox key={i} value={item.props.name}>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Content>
            <Label>{item.props.label}</Label>
            {item.props.description && (
              <Description>{item.props.description}</Description>
            )}
          </Checkbox.Content>
        </Checkbox>
      ))}
    </HeroUICheckboxGroup>
  );
}

export const CheckBoxGroup = defineComponent({
  name: "CheckBoxGroup",
  props: CheckBoxGroupSchema,
  description: "Checkbox group",
  component: CheckBoxGroupRenderer,
});
