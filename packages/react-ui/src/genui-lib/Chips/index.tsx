"use client";

import {
  ComponentRenderProps,
  defineComponent,
  parseStructuredRules,
  useFormName,
  useFormValidation,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
  type SubComponentOf,
} from "@openuidev/react-lang";
import React from "react";
import { Chips as OpenUIChips } from "../../components/Chips";
import { useHydrateDefaultFieldValue } from "../formDefaultValueUtils";
import { getStoredDefaultValue, normalizeSelection, toggleSelection } from "../selectionFieldUtils";
import { ChipsSchema, type ChipItemProps, type ChipsProps } from "./schema";

export * from "./schema";

function ChipsRenderer({ props, renderNode }: ComponentRenderProps<ChipsProps>) {
  const formName = useFormName();
  const getFieldValue = useGetFieldValue();
  const setFieldValue = useSetFieldValue();
  const isStreaming = useIsStreaming();
  const formValidation = useFormValidation();

  const fieldName = props.name;
  const type = props.type ?? "multiple";
  const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
  const hasRules = rules.length > 0;

  const items = ((props.items ?? []) as Array<SubComponentOf<ChipItemProps>>).filter(
    (item) => item.props.value,
  );
  const existingValue = getFieldValue(formName, fieldName);
  const selection = normalizeSelection(type, existingValue, props.defaultValue);
  const storedDefaultValue = React.useMemo(
    () => getStoredDefaultValue(type, props.defaultValue),
    [type, props.defaultValue],
  );

  useHydrateDefaultFieldValue({
    formName,
    componentType: "Chips",
    name: fieldName,
    existingValue,
    defaultValue: storedDefaultValue,
  });

  React.useEffect(() => {
    if (!isStreaming && hasRules && formValidation) {
      formValidation.registerField(fieldName, rules, () => {
        const value = getFieldValue(formName, fieldName) ?? storedDefaultValue;
        if (type === "single") {
          return typeof value === "string" && value ? value : undefined;
        }
        return Array.isArray(value) && value.length > 0 ? value : undefined;
      });
      return () => formValidation.unregisterField(fieldName);
    }
    return undefined;
  }, [
    fieldName,
    formName,
    formValidation,
    getFieldValue,
    hasRules,
    isStreaming,
    rules,
    storedDefaultValue,
    type,
  ]);

  const handleToggle = (itemValue: string) => {
    if (isStreaming) return;

    const nextSelection = toggleSelection(type, selection, itemValue);
    const storedValue = type === "single" ? (nextSelection[0] ?? undefined) : nextSelection;
    const validationValue =
      type === "single"
        ? (nextSelection[0] ?? undefined)
        : nextSelection.length > 0
          ? nextSelection
          : undefined;

    setFieldValue(formName, "Chips", fieldName, storedValue, true);

    if (hasRules) {
      formValidation?.validateField(fieldName, validationValue, rules);
    }
  };

  return (
    <OpenUIChips
      type={type}
      selected={selection}
      disabled={isStreaming}
      onToggle={handleToggle}
      items={items.map((item) => ({
        value: item.props.value,
        label: item.props.label,
        icon: item.props.icon ? renderNode(item.props.icon) : undefined,
        disabled: item.props.disabled,
      }))}
    />
  );
}

export const Chips = defineComponent({
  name: "Chips",
  props: ChipsSchema,
  description:
    "A form field of compact selectable chips for choosing one or many short options; the selection is stored under `name`.",
  component: ChipsRenderer,
});
