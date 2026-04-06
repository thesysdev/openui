"use client";

import {
  defineComponent,
  useIsStreaming,
  useStateField,
  type SubComponentOf,
} from "@openuidev/react-lang";
import React from "react";
import { SwitchGroup as OpenUISwitchGroup } from "../../components/SwitchGroup";
import { SwitchItem as OpenUISwitchItem } from "../../components/SwitchItem";
import { SwitchItemSchema, createSwitchGroupSchema } from "./schema";

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
  props: createSwitchGroupSchema(SwitchItem),
  description: "Group of switch toggles",
  component: ({ props }) => {
    const isStreaming = useIsStreaming();

    const field = useStateField(props.name, props.value);
    const items = (props.items ?? []) as Array<SubComponentOf<SwitchItemProps>>;

    // Aggregate: map of item name → checked boolean
    const getAggregate = React.useCallback((): Record<string, boolean> => {
      const stored = field.value;
      const result: Record<string, boolean> = {};
      for (const item of items) {
        result[item.props.name] = stored?.[item.props.name] ?? item.props.defaultChecked ?? false;
      }
      return result;
    }, [field.value, items]);

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
              const newAggregate = { ...getAggregate(), [item.props.name]: val };
              field.setValue(newAggregate);
            }}
            disabled={isStreaming}
          />
        ))}
      </OpenUISwitchGroup>
    );
  },
});
