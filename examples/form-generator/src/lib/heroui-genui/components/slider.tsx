"use client";

import { Slider as HeroUISlider } from "@heroui/react";
import {
  type ComponentRenderProps,
  defineComponent,
  parseStructuredRules,
  useFormName,
  useFormValidation,
  useGetFieldValue,
  useIsStreaming,
  useSetDefaultValue,
  useSetFieldValue,
} from "@openuidev/react-lang";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { rulesSchema } from "../rules";

const SliderSchema = z.object({
  name: z.string(),
  variant: z.enum(["continuous", "discrete"]),
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
  defaultValue: z.array(z.number()).optional(),
  label: z.string().optional(),
  rules: rulesSchema,
});

function SliderRenderer({ props }: ComponentRenderProps<z.infer<typeof SliderSchema>>) {
  const formName = useFormName();
  const getFieldValue = useGetFieldValue();
  const setFieldValue = useSetFieldValue();
  const isStreaming = useIsStreaming();
  const formValidation = useFormValidation();

  const fieldName = props.name;
  const rules = useMemo(() => parseStructuredRules(props.rules), [props.rules]);
  const existingValue = getFieldValue(formName, fieldName);
  const defaultVal = props.defaultValue;

  useSetDefaultValue({
    formName,
    componentType: "Slider",
    name: fieldName,
    existingValue,
    defaultValue: defaultVal,
  });

  useEffect(() => {
    if (!isStreaming && rules.length > 0 && formValidation) {
      formValidation.registerField(fieldName, rules, () => getFieldValue(formName, fieldName));
      return () => formValidation.unregisterField(fieldName);
    }
    return undefined;
  }, [isStreaming, rules.length > 0]);

  const value = existingValue ?? defaultVal;
  const step = props.variant === "discrete" ? (props.step ?? 1) : props.step;

  return (
    <HeroUISlider
      defaultValue={value != null ? value : undefined}
      minValue={props.min}
      maxValue={props.max}
      step={step}
      isDisabled={isStreaming}
      onChangeEnd={(vals) => {
        const normalized = Array.isArray(vals) ? vals : [vals];
        setFieldValue(formName, "Slider", fieldName, normalized, true);
        if (rules.length > 0) {
          formValidation?.validateField(fieldName, normalized[0], rules);
        }
      }}
    >
      <HeroUISlider.Output />
      <HeroUISlider.Track>
        <HeroUISlider.Fill />
        <HeroUISlider.Thumb />
      </HeroUISlider.Track>
    </HeroUISlider>
  );
}

export const Slider = defineComponent({
  name: "Slider",
  props: SliderSchema,
  description: "Numeric slider input",
  component: SliderRenderer,
});
