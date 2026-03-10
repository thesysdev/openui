"use client";

import {
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
import { z } from "zod";
import { CheckBoxGroup as OpenUICheckBoxGroup } from "../../components/CheckBoxGroup";
import { CheckBoxItem as OpenUICheckBoxItem } from "../../components/CheckBoxItem";
import { rulesSchema } from "../rules";
import { CheckBoxItemSchema } from "./schema";

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
  props: z.object({
    name: z.string(),
    items: z.array(CheckBoxItem.ref),
    rules: rulesSchema,
  }),
  description: "",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const fieldName = props.name as string;
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const items = (props.items ?? []) as Array<SubComponentOf<CheckBoxItemProps>>;

    const getAggregate = React.useCallback((): Record<string, boolean> => {
      const stored = getFieldValue(formName, fieldName) as Record<string, boolean> | undefined;
      const result: Record<string, boolean> = {};
      for (const item of items) {
        result[item.props.name] = stored?.[item.props.name] ?? item.props.defaultChecked ?? false;
      }
      return result;
    }, [formName, fieldName, items, getFieldValue]);

    React.useEffect(() => {
      if (!isStreaming && items.length > 0 && getFieldValue(formName, fieldName) == null) {
        const initial: Record<string, boolean> = {};
        for (const item of items) {
          initial[item.props.name] = item.props.defaultChecked ?? false;
        }
        setFieldValue(formName, "CheckBoxGroup", fieldName, initial, false);
      }
    }, [isStreaming]);

    React.useEffect(() => {
      if (!isStreaming && rules.length > 0 && formValidation) {
        formValidation.registerField(fieldName, rules, () => getFieldValue(formName, fieldName));
        return () => formValidation.unregisterField(fieldName);
      }
      return undefined;
    }, [isStreaming, rules.length > 0]);

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
              setFieldValue(formName, "CheckBoxGroup", fieldName, newAggregate, true);
              if (rules.length > 0) {
                formValidation?.validateField(fieldName, newAggregate, rules);
              }
            }}
            disabled={isStreaming}
          />
        ))}
      </OpenUICheckBoxGroup>
    );
  },
});
