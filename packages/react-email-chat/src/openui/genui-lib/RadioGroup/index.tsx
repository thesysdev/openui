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
import { z } from "zod";
import { RadioGroup as OpenUIRadioGroup } from "@openuidev/react-ui/RadioGroup";
import { RadioItem as OpenUIRadioItem } from "@openuidev/react-ui/RadioItem";
import { rulesSchema } from "../rules";
import { RadioItemSchema } from "./schema";

export { RadioItemSchema } from "./schema";

export const RadioItem = defineComponent({
  name: "RadioItem",
  props: RadioItemSchema,
  description: "",
  component: () => null,
});

export const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: z.object({
    name: z.string(),
    items: z.array(RadioItem.ref),
    defaultValue: z.string().optional(),
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
    const items = (props.items ?? []) as Array<{
      props: { value: string; label?: string; description?: string };
    }>;

    const value = (getFieldValue(formName, fieldName) ?? props.defaultValue) as string | undefined;

    React.useEffect(() => {
      if (
        !isStreaming &&
        props.defaultValue != null &&
        getFieldValue(formName, fieldName) == null
      ) {
        setFieldValue(formName, "RadioGroup", fieldName, props.defaultValue, false);
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

    return (
      <OpenUIRadioGroup
        name={fieldName}
        value={value ?? ""}
        onValueChange={(val: string) => {
          setFieldValue(formName, "RadioGroup", fieldName, val, true);
          if (rules.length > 0) {
            formValidation?.validateField(fieldName, val, rules);
          }
        }}
        disabled={isStreaming}
      >
        {items.map((item, i) => (
          <OpenUIRadioItem
            key={i}
            value={item.props.value}
            label={item.props.label}
            description={item.props.description || ""}
          />
        ))}
      </OpenUIRadioGroup>
    );
  },
});
