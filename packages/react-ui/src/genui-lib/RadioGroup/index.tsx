"use client";

import {
  defineComponent,
  parseStructuredRules,
  reactive,
  useFormValidation,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { RadioGroup as OpenUIRadioGroup } from "../../components/RadioGroup";
import { RadioItem as OpenUIRadioItem } from "../../components/RadioItem";
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
    value: reactive(z.string().optional()),
  }),
  description: "",
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const field = useStateField(props.name, props.value);
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const hasRules = rules.length > 0;
    const items = (props.items ?? []) as Array<{
      props: { value: string; label?: string; description?: string };
    }>;

    const value = field.value ?? props.defaultValue;

    React.useEffect(() => {
      if (!isStreaming && hasRules && formValidation) {
        formValidation.registerField(field.name, rules, () => field.value);
        return () => formValidation.unregisterField(field.name);
      }
      return undefined;
    }, [field.name, field.value, formValidation, hasRules, isStreaming, rules]);

    if (!items.length) return null;

    return (
      <OpenUIRadioGroup
        name={field.name}
        value={value ?? ""}
        onValueChange={(val: string) => {
          field.setValue(val);
          if (hasRules) {
            formValidation?.validateField(field.name, val, rules);
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
