"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormName,
  useFormValidation,
  useGetFieldValue,
  useIsStreaming,
  useSetDefaultValue,
  useSetFieldValue,
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
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const fieldName = props.name as string;
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const existingValue = getFieldValue(formName, fieldName);
    const defaultVal = props.defaultValue;

    useSetDefaultValue({
      formName,
      componentType: "Slider",
      name: fieldName,
      existingValue,
      defaultValue: defaultVal,
    });

    React.useEffect(() => {
      if (!isStreaming && rules.length > 0 && formValidation) {
        formValidation.registerField(fieldName, rules, () => getFieldValue(formName, fieldName));
        return () => formValidation.unregisterField(fieldName);
      }
      return undefined;
    }, [isStreaming, rules.length > 0]);

    const value = existingValue ?? defaultVal;

    return (
      <OpenUISliderBlock
        label={(props.label as string) || fieldName}
        name={fieldName}
        variant={(props.variant as "continuous" | "discrete") || "continuous"}
        min={props.min as number}
        max={props.max as number}
        step={props.step as number | undefined}
        defaultValue={value != null ? value : undefined}
        onValueCommit={(vals: number[]) => {
          setFieldValue(formName, "Slider", fieldName, vals, true);
          if (rules.length > 0) {
            formValidation?.validateField(fieldName, vals[0], rules);
          }
        }}
        disabled={isStreaming}
      />
    );
  },
});
