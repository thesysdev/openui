"use client";

import { Label as ShadcnLabel } from "@/components/ui/label";
import { RadioGroupItem, RadioGroup as ShadcnRadioGroup } from "@/components/ui/radio-group";
import {
  defineComponent,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/react-lang";
import { z } from "zod";

const RadioItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const RadioItem = defineComponent({
  name: "RadioItem",
  props: RadioItemSchema,
  description: "Option in a RadioGroup.",
  component: () => null,
});

const RadioGroupSchema = z.object({
  name: z.string(),
  items: z.array(RadioItem.ref),
});

export const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: RadioGroupSchema,
  description: "Radio selection group. items: RadioItem[].",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();

    const fieldName = props.name as string;
    const value = (getFieldValue(formName, fieldName) as string | undefined) ?? "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = ((props.items ?? []) as any[]).filter((item) => item?.props?.value);

    return (
      <ShadcnRadioGroup
        value={value}
        onValueChange={(val) => {
          setFieldValue(formName, "RadioGroup", fieldName, val, true);
        }}
        disabled={isStreaming}
      >
        {items.map((item, i) => {
          const val = item.props.value as string;
          return (
            <div key={i} className="flex items-center space-x-2">
              <RadioGroupItem value={val} id={`${fieldName}-${val}`} />
              <ShadcnLabel htmlFor={`${fieldName}-${val}`}>{item.props.label || val}</ShadcnLabel>
            </div>
          );
        })}
      </ShadcnRadioGroup>
    );
  },
});
