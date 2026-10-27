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
  description:
    'One toggle in a SwitchGroup: SwitchItem(label?, description?, name, defaultChecked?), e.g. SwitchItem("Email alerts", "Get a message when a build fails", "email-alerts", true). name is the key submitted with the form; description is an optional one-line explanation under the label; defaultChecked starts it on.',
  component: () => null,
});

export const SwitchGroup = defineComponent({
  name: "SwitchGroup",
  props: createSwitchGroupSchema(SwitchItem),
  description:
    "A list of on/off switches inside a FormControl, for independent settings or preferences that each turn on or off: SwitchGroup(name, items, value?). value binds a $variable holding { name: boolean }. It has no frame of its own; put it in a Card when it needs one. To pick items from a list use CheckBoxGroup, and for one choice among several use RadioGroup.",
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
      <OpenUISwitchGroup variant="clear">
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
