"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label as ShadcnLabel } from "@/components/ui/label";
import {
  defineComponent,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/react-lang";
import { z } from "zod";

const CheckBoxItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const CheckBoxItem = defineComponent({
  name: "CheckBoxItem",
  props: CheckBoxItemSchema,
  description: "Option in a CheckBoxGroup.",
  component: () => null,
});

const CheckBoxGroupSchema = z.object({
  name: z.string(),
  items: z.array(CheckBoxItem.ref),
});

export const CheckBoxGroup = defineComponent({
  name: "CheckBoxGroup",
  props: CheckBoxGroupSchema,
  description: "Multiple checkbox options. items: CheckBoxItem[].",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();

    const fieldName = props.name as string;
    const current = (getFieldValue(formName, fieldName) as string[] | undefined) ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = ((props.items ?? []) as any[]).filter((item) => item?.props?.value);

    return (
      <div className="space-y-2">
        {items.map((item, i) => {
          const val = item.props.value as string;
          const checked = current.includes(val);
          return (
            <div key={i} className="flex items-center space-x-2">
              <Checkbox
                id={`${fieldName}-${val}`}
                checked={checked}
                onCheckedChange={(c) => {
                  const next = c ? [...current, val] : current.filter((v: string) => v !== val);
                  setFieldValue(formName, "CheckBoxGroup", fieldName, next, true);
                }}
                disabled={isStreaming}
              />
              <ShadcnLabel htmlFor={`${fieldName}-${val}`}>{item.props.label || val}</ShadcnLabel>
            </div>
          );
        })}
      </div>
    );
  },
});
