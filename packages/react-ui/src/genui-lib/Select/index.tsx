"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormValidation,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import React from "react";
import {
  Select as OpenUISelect,
  SelectContent as OpenUISelectContent,
  SelectItem as OpenUISelectItem,
  SelectTrigger as OpenUISelectTrigger,
  SelectValue as OpenUISelectValue,
} from "../../components/Select";
import { SelectItemSchema, createSelectSchema } from "./schema";

export { SelectItemSchema } from "./schema";

export const SelectItem = defineComponent({
  name: "SelectItem",
  props: SelectItemSchema,
  description: "Option for Select",
  component: () => null,
});

export const Select = defineComponent({
  name: "Select",
  props: createSelectSchema(SelectItem),
  description: "",
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const field = useStateField(props.name, props.value);

    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const hasRules = rules.length > 0;
    const items = (
      (props.items ?? []) as Array<{ props: { value: string; label?: string } }>
    ).filter((item) => item?.props?.value);

    const value = field.value ?? "";

    const handleChange = React.useCallback(
      (val: string) => {
        field.setValue(val);
        if (hasRules) {
          formValidation?.validateField(field.name, val, rules);
        }
      },
      [field, formValidation, hasRules, rules],
    );

    React.useEffect(() => {
      if (!isStreaming && hasRules && formValidation) {
        formValidation.registerField(field.name, rules, () => field.value);
        return () => formValidation.unregisterField(field.name);
      }
      return undefined;
    }, [field.name, field.value, formValidation, hasRules, isStreaming, rules]);

    return (
      <OpenUISelect
        name={field.name}
        value={value}
        onValueChange={handleChange}
        disabled={isStreaming}
      >
        <OpenUISelectTrigger>
          <OpenUISelectValue placeholder={props.placeholder || "Select..."} />
        </OpenUISelectTrigger>
        <OpenUISelectContent>
          {items.map((item, i) => (
            <OpenUISelectItem key={i} value={item.props.value}>
              {item.props.label || item.props.value}
            </OpenUISelectItem>
          ))}
        </OpenUISelectContent>
      </OpenUISelect>
    );
  },
});
