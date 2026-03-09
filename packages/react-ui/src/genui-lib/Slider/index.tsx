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
} from "@openuidev/lang-react";
import React from "react";
import { Slider as OpenUISlider } from "../../components/Slider";
import { SliderSchema } from "./schema";

export { SliderSchema } from "./schema";

export const Slider = defineComponent({
  name: "Slider",
  props: SliderSchema,
  description: "",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const fieldName = props.name as string;
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const existingValue = getFieldValue(formName, fieldName);
    const defaultVal = props.defaultValue as number | undefined;

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
      <OpenUISlider
        name={fieldName}
        variant={(props.variant as "continuous" | "discrete") || "continuous"}
        min={props.min as number}
        max={props.max as number}
        step={props.step as number | undefined}
        value={value != null ? [value as number] : undefined}
        onValueCommit={(vals: number[]) => {
          setFieldValue(formName, "Slider", fieldName, vals[0], true);
          if (rules.length > 0) {
            formValidation?.validateField(fieldName, vals[0], rules);
          }
        }}
        disabled={isStreaming}
      />
    );
  },
});
