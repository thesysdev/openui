"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormValidation,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import React from "react";
import { SliderBlock as OpenUISliderBlock } from "../../components/Slider";
import { SliderSchema } from "./schema";

export { SliderSchema } from "./schema";

export const Slider = defineComponent({
  name: "Slider",
  props: SliderSchema,
  description: "Numeric slider input; supports continuous and discrete (stepped) variants",
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const field = useStateField(props.name, props.value);
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const hasRules = rules.length > 0;
    const value = field.value ?? props.defaultValue;

    React.useEffect(() => {
      if (!isStreaming && hasRules && formValidation) {
        formValidation.registerField(field.name, rules, () => field.value);
        return () => formValidation.unregisterField(field.name);
      }
      return undefined;
    }, [field.name, field.value, formValidation, hasRules, isStreaming, rules]);

    return (
      <OpenUISliderBlock
        label={(props.label as string) || field.name}
        name={field.name}
        variant={(props.variant as "continuous" | "discrete") || "continuous"}
        min={props.min as number}
        max={props.max as number}
        step={props.step as number | undefined}
        defaultValue={value != null ? (value as number[]) : undefined}
        onValueCommit={(vals: number[]) => {
          field.setValue(vals);
          if (hasRules) {
            formValidation?.validateField(field.name, vals[0], rules);
          }
        }}
        disabled={isStreaming}
      />
    );
  },
});
