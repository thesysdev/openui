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
import { OptionCards as OpenUIOptionCards } from "../../components/OptionCards";
import { useHydrateDefaultFieldValue } from "../formDefaultValueUtils";
import { renderOneOrMany } from "../oneOrMany";
import { getStoredDefaultValue, normalizeSelection, toggleSelection } from "../selectionFieldUtils";
import { OptionCardsSchema, type OptionCardProps, type OptionCardsProps } from "./schema";

export * from "./schema";

function isImageLeading(leading: unknown): boolean {
  // Only an Image gets the large tile; an Avatar also carries a src.
  const candidate = leading as { type?: unknown; typeName?: unknown } | null | undefined;
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    candidate.type === "element" &&
    candidate.typeName === "Image"
  );
}

function OptionCardsRenderer({ props, renderNode }: ComponentRenderProps<OptionCardsProps>) {
  const formName = useFormName();
  const getFieldValue = useGetFieldValue();
  const setFieldValue = useSetFieldValue();
  const isStreaming = useIsStreaming();
  const formValidation = useFormValidation();

  const fieldName = props.name;
  const type = props.type ?? "single";
  const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
  const hasRules = rules.length > 0;

  const items = ((props.items ?? []) as Array<SubComponentOf<OptionCardProps>>).filter(
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
    componentType: "OptionCards",
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

    setFieldValue(formName, "OptionCards", fieldName, storedValue, true);

    if (hasRules) {
      formValidation?.validateField(fieldName, validationValue, rules);
    }
  };

  return (
    <OpenUIOptionCards
      type={type}
      selected={selection}
      disabled={isStreaming}
      onToggle={handleToggle}
      items={items.map((item) => {
        const leading = item.props.leading;
        return {
          value: item.props.value,
          title: item.props.title,
          subtitle: renderOneOrMany(item.props.subtitle, renderNode),
          leading: leading != null ? renderNode(leading) : undefined,
          leadingVariant: isImageLeading(leading) ? "image" : "icon",
          disabled: item.props.disabled,
        };
      })}
    />
  );
}

export const OptionCards = defineComponent({
  name: "OptionCards",
  props: OptionCardsSchema,
  description:
    'A form field of selectable cards in a responsive grid, inside a FormControl, for choosing one or many options that need a short explanation: OptionCards(name, "single" | "multiple", [OptionCard(...), ...], rules?). The selected card shows a checkmark. Use it for 2–6 meaningful choices such as a plan, trip type or working style; for many short labels use Chips, and for a long list use Select. Every card should have the same parts, all with a leading or none. The selection is stored under `name`.',
  component: OptionCardsRenderer,
});
