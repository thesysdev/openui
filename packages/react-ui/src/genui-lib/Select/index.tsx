"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormValidation,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import clsx from "clsx";
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
  description:
    "One option in a Select: SelectItem(value, label); value is what the form submits, label is what the user sees.",
  component: () => null,
});

export const Select = defineComponent({
  name: "Select",
  props: createSelectSchema(SelectItem),
  description:
    'A dropdown of SelectItems inside a FormControl, for picking one option from four or more: Select(name, items, placeholder?, rules?, value?, variant?), e.g. Select("country", [SelectItem("us", "United States"), SelectItem("uk", "United Kingdom"), SelectItem("de", "Germany")], "Select…", { required: true }). For two or three options, RadioGroup or Chips show every choice at once. value binds a $variable, e.g. a sort field that drives @Sort. variant "inline" is borderless until hover or focus, for table cells and dense rows; use "default" everywhere else.',
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
        <OpenUISelectTrigger
          className={clsx("openui-genui-select", {
            "openui-genui-select--inline": props.variant === "inline",
          })}
        >
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
