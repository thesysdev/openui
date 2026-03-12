"use client";

import { Slider as ShadcnSlider } from "@/components/ui/slider";
import {
  defineComponent,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useSetDefaultValue,
  useSetFieldValue,
} from "@openuidev/react-lang";
import { z } from "zod";

const SliderSchema = z.object({
  name: z.string(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  defaultValue: z.number().optional(),
});

export const Slider = defineComponent({
  name: "Slider",
  props: SliderSchema,
  description: "Range slider input. min, max, step, defaultValue.",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();

    const fieldName = props.name as string;
    const saved = getFieldValue(formName, fieldName) as number | undefined;
    const val = saved ?? props.defaultValue ?? props.min ?? 0;

    useSetDefaultValue({
      formName: formName ?? "",
      componentType: "Slider",
      name: fieldName,
      existingValue: saved,
      defaultValue: props.defaultValue ?? props.min ?? 0,
      shouldTriggerSaveCallback: true,
    });

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{fieldName}</span>
          <span className="text-muted-foreground tabular-nums">{val}</span>
        </div>
        <ShadcnSlider
          min={props.min ?? 0}
          max={props.max ?? 100}
          step={props.step ?? 1}
          value={[val]}
          onValueChange={([v]) => {
            setFieldValue(formName, "Slider", fieldName, v, true);
          }}
          disabled={isStreaming}
        />
      </div>
    );
  },
});
