"use client";

import {
  defineComponent,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
  type SubComponentOf,
} from "@openuidev/lang-react";
import React from "react";
import { z } from "zod";
import { SwitchGroup as OpenUISwitchGroup } from "../../components/SwitchGroup";
import { SwitchItem as OpenUISwitchItem } from "../../components/SwitchItem";
import { SwitchItemSchema } from "./schema";

export { SwitchItemSchema } from "./schema";

type SwitchItemProps = {
  name: string;
  label?: string;
  description?: string;
  defaultChecked?: boolean;
};

export const SwitchItem = defineComponent({
  name: "SwitchItem",
  props: SwitchItemSchema,
  description: "Individual switch toggle",
  component: () => null,
});

export const SwitchGroup = defineComponent({
  name: "SwitchGroup",
  props: z.object({
    name: z.string(),
    items: z.array(SwitchItem.ref),
    variant: z.enum(["clear", "card", "sunk"]).optional(),
  }),
  description: "Group of switch toggles",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();

    const fieldName = props.name as string;
    const items = (props.items ?? []) as Array<SubComponentOf<SwitchItemProps>>;

    const getAggregate = React.useCallback((): Record<string, boolean> => {
      const stored = getFieldValue(formName, fieldName) as Record<string, boolean> | undefined;
      const result: Record<string, boolean> = {};
      for (const item of items) {
        result[item.props.name] = stored?.[item.props.name] ?? item.props.defaultChecked ?? false;
      }
      return result;
    }, [formName, fieldName, items, getFieldValue]);

    if (!items.length) return null;

    const aggregate = getAggregate();

    return (
      <OpenUISwitchGroup variant={(props.variant as any) || "clear"}>
        {items.map((item, i) => (
          <OpenUISwitchItem
            key={i}
            name={item.props.name}
            label={item.props.label}
            description={item.props.description || ""}
            checked={aggregate[item.props.name] ?? item.props.defaultChecked ?? false}
            onChange={(val: boolean) => {
              const newAggregate =
                items.length === 1
                  ? val // single item: store boolean directly
                  : { ...getAggregate(), [item.props.name]: val };
              setFieldValue(formName, "SwitchGroup", fieldName, newAggregate, true);
            }}
            disabled={isStreaming}
          />
        ))}
      </OpenUISwitchGroup>
    );
  },
});
