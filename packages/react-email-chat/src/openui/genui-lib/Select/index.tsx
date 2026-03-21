"use client";

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
import {
  Select as OpenUISelect,
  SelectContent as OpenUISelectContent,
  SelectItem as OpenUISelectItem,
  SelectTrigger as OpenUISelectTrigger,
  SelectValue as OpenUISelectValue,
} from "@openuidev/react-ui/Select";
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
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const items = (
      (props.items ?? []) as Array<{ props: { value: string; label?: string } }>
    ).filter((item) => item.props.value);
    const value = getFieldValue(formName, props.name);

    React.useEffect(() => {
      if (!isStreaming && rules.length > 0 && formValidation) {
        formValidation.registerField(props.name, rules, () => getFieldValue(formName, props.name));
        return () => formValidation.unregisterField(props.name);
      }
      return undefined;
    }, [isStreaming, rules.length > 0]);

    return (
      <OpenUISelect
        name={props.name}
        value={value ?? ""}
        onValueChange={(val: string) => {
          setFieldValue(formName, "Select", props.name, val, true);
          if (rules.length > 0) {
            formValidation?.validateField(props.name, val, rules);
          }
        }}
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
