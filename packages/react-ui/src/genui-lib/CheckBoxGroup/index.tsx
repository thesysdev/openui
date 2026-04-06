"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormValidation,
  useIsStreaming,
  useStateField,
  type SubComponentOf,
} from "@openuidev/react-lang";
import React from "react";
import { CheckBoxGroup as OpenUICheckBoxGroup } from "../../components/CheckBoxGroup";
import { CheckBoxItem as OpenUICheckBoxItem } from "../../components/CheckBoxItem";
import { CheckBoxItemSchema, createCheckBoxGroupSchema } from "./schema";

export { CheckBoxItemSchema } from "./schema";

type CheckBoxItemProps = {
  name: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
};

export const CheckBoxItem = defineComponent({
  name: "CheckBoxItem",
  props: CheckBoxItemSchema,
  description: "",
  component: () => null,
});

export const CheckBoxGroup = defineComponent({
  name: "CheckBoxGroup",
  props: createCheckBoxGroupSchema(CheckBoxItem),
  description: "",
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const field = useStateField(props.name, props.value);
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const hasRules = rules.length > 0;
    const items = (props.items ?? []) as Array<SubComponentOf<CheckBoxItemProps>>;

    // Aggregate: map of item name → checked boolean
    const getAggregate = React.useCallback((): Record<string, boolean> => {
      const stored = field.value;
      const result: Record<string, boolean> = {};
      for (const item of items) {
        result[item.props.name] = stored?.[item.props.name] ?? item.props.defaultChecked ?? false;
      }
      return result;
    }, [field.value, items]);

    React.useEffect(() => {
      if (!isStreaming && hasRules && formValidation) {
        formValidation.registerField(field.name, rules, () => field.value);
        return () => formValidation.unregisterField(field.name);
      }
      return undefined;
    }, [field.name, field.value, formValidation, hasRules, isStreaming, rules]);

    if (!items.length) return null;

    const aggregate = getAggregate();

    return (
      <OpenUICheckBoxGroup>
        {items.map((item, i) => (
          <OpenUICheckBoxItem
            key={i}
            name={item.props.name}
            label={item.props.label}
            description={item.props.description || ""}
            checked={aggregate[item.props.name] ?? item.props.defaultChecked ?? false}
            onChange={(val: boolean) => {
              const newAggregate = { ...getAggregate(), [item.props.name]: val };
              field.setValue(newAggregate);
              if (hasRules) {
                formValidation?.validateField(field.name, newAggregate, rules);
              }
            }}
            disabled={isStreaming}
          />
        ))}
      </OpenUICheckBoxGroup>
    );
  },
});
