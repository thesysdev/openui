"use client";

import { Label as ShadcnLabel } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  defineComponent,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/react-lang";
import { z } from "zod";

const SwitchItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const SwitchItem = defineComponent({
  name: "SwitchItem",
  props: SwitchItemSchema,
  description: "Toggle option in a SwitchGroup.",
  component: () => null,
});

const SwitchGroupSchema = z.object({
  name: z.string(),
  items: z.array(SwitchItem.ref),
});

export const SwitchGroup = defineComponent({
  name: "SwitchGroup",
  props: SwitchGroupSchema,
  description: "Group of toggle switches. items: SwitchItem[].",
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
      <div className="space-y-3">
        {items.map((item, i) => {
          const val = item.props.value as string;
          const checked = current.includes(val);
          return (
            <div key={i} className="flex items-center justify-between">
              <ShadcnLabel htmlFor={`${fieldName}-${val}`}>
                {item.props.label || val}
              </ShadcnLabel>
              <Switch
                id={`${fieldName}-${val}`}
                checked={checked}
                onCheckedChange={(c) => {
                  const next = c
                    ? [...current, val]
                    : current.filter((v: string) => v !== val);
                  setFieldValue(formName, "SwitchGroup", fieldName, next, true);
                }}
                disabled={isStreaming}
              />
            </div>
          );
        })}
      </div>
    );
  },
});
