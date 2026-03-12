"use client";

import { ToggleGroup as ShadcnToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  defineComponent,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/react-lang";
import { z } from "zod";

const ToggleGroupItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const ToggleGroupItemDef = defineComponent({
  name: "ToggleGroupItem",
  props: ToggleGroupItemSchema,
  description: "Option in a ToggleGroup.",
  component: () => null,
});

const ToggleGroupSchema = z.object({
  name: z.string(),
  items: z.array(ToggleGroupItemDef.ref),
  type: z.enum(["single", "multiple"]).optional(),
});

export const ToggleGroup = defineComponent({
  name: "ToggleGroup",
  props: ToggleGroupSchema,
  description: 'Toggle button group. type: "single" | "multiple". items: ToggleGroupItem[].',
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();

    const fieldName = props.name as string;
    const value = getFieldValue(formName, fieldName);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = ((props.items ?? []) as any[]).filter((item) => item?.props?.value);
    const type = props.type ?? "single";

    if (type === "multiple") {
      const current = (value as string[] | undefined) ?? [];
      return (
        <ShadcnToggleGroup
          type="multiple"
          value={current}
          onValueChange={(val) => {
            setFieldValue(formName, "ToggleGroup", fieldName, val, true);
          }}
          disabled={isStreaming}
        >
          {items.map((item, i) => (
            <ToggleGroupItem key={i} value={item.props.value}>
              {item.props.label || item.props.value}
            </ToggleGroupItem>
          ))}
        </ShadcnToggleGroup>
      );
    }

    return (
      <ShadcnToggleGroup
        type="single"
        value={(value as string) ?? ""}
        onValueChange={(val) => {
          setFieldValue(formName, "ToggleGroup", fieldName, val, true);
        }}
        disabled={isStreaming}
      >
        {items.map((item, i) => (
          <ToggleGroupItem key={i} value={item.props.value}>
            {item.props.label || item.props.value}
          </ToggleGroupItem>
        ))}
      </ShadcnToggleGroup>
    );
  },
});

export { ToggleGroupItemDef as ToggleGroupItem };
