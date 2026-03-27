"use client";

import { ListBox, Select as HeroUISelect } from "@heroui/react";
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

const SelectItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const SelectItem = defineComponent({
  name: "SelectItem",
  props: SelectItemSchema,
  description: "Option for Select",
  component: () => null,
});

const SelectSchema = z.object({
  name: z.string(),
  items: z.array(SelectItem.ref),
  placeholder: z.string().optional(),
  rules: rulesSchema,
});

function SelectRenderer({ props }: ComponentRenderProps<z.infer<typeof SelectSchema>>) {
  const formName = useFormName();
  const getFieldValue = useGetFieldValue();
  const setFieldValue = useSetFieldValue();
  const isStreaming = useIsStreaming();
  const formValidation = useFormValidation();

  const fieldName = props.name;
  const rules = useMemo(() => parseStructuredRules(props.rules), [props.rules]);
  const items = (props.items ?? []).filter((item) => item.props.value);
  const value = getFieldValue(formName, fieldName);

  useEffect(() => {
    if (!isStreaming && rules.length > 0 && formValidation) {
      formValidation.registerField(fieldName, rules, () => getFieldValue(formName, fieldName));
      return () => formValidation.unregisterField(fieldName);
    }
    return undefined;
  }, [isStreaming, rules.length > 0]);

  return (
    <HeroUISelect
      aria-label={fieldName}
      id={fieldName}
      name={fieldName}
      placeholder={props.placeholder ?? "Select..."}
      selectedKey={value ?? null}
      onSelectionChange={(key) => {
        const val = String(key);
        setFieldValue(formName, "Select", fieldName, val, true);
        if (rules.length > 0) {
          formValidation?.validateField(fieldName, val, rules);
        }
      }}
      isDisabled={isStreaming}
    >
      <HeroUISelect.Trigger>
        <HeroUISelect.Value />
        <HeroUISelect.Indicator />
      </HeroUISelect.Trigger>
      <HeroUISelect.Popover>
        <ListBox>
          {items.map((item) => (
            <ListBox.Item
              key={item.props.value}
              id={item.props.value}
              textValue={item.props.label || item.props.value}
            >
              {item.props.label || item.props.value}
            </ListBox.Item>
          ))}
        </ListBox>
      </HeroUISelect.Popover>
    </HeroUISelect>
  );
}

export const Select = defineComponent({
  name: "Select",
  props: SelectSchema,
  description: "Dropdown select",
  component: SelectRenderer,
});
