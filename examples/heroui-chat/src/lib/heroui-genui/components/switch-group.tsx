"use client";

import {
  Description,
  Label,
  Switch,
  SwitchGroup as HeroUISwitchGroup,
} from "@heroui/react";
import {
  type ComponentRenderProps,
  defineComponent,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/react-lang";
import { useCallback } from "react";
import { z } from "zod";

const SwitchItemSchema = z.object({
  label: z.string().optional(),
  description: z.string().optional(),
  name: z.string(),
  defaultChecked: z.boolean().optional(),
});

export const SwitchItem = defineComponent({
  name: "SwitchItem",
  props: SwitchItemSchema,
  description: "Individual switch toggle",
  component: () => null,
});

const SwitchGroupSchema = z.object({
  name: z.string(),
  items: z.array(SwitchItem.ref),
});

function SwitchGroupRenderer({ props }: ComponentRenderProps<z.infer<typeof SwitchGroupSchema>>) {
  const formName = useFormName();
  const getFieldValue = useGetFieldValue();
  const setFieldValue = useSetFieldValue();
  const isStreaming = useIsStreaming();

  const fieldName = props.name;
  const items = props.items ?? [];

  const getAggregate = useCallback((): Record<string, boolean> => {
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
    <HeroUISwitchGroup>
      {items.map((item) => (
        <Switch
          key={item.props.name}
          isSelected={aggregate[item.props.name] ?? item.props.defaultChecked ?? false}
          onChange={(isSelected: boolean) => {
            const newAggregate = { ...getAggregate(), [item.props.name]: isSelected };
            setFieldValue(formName, "SwitchGroup", fieldName, newAggregate, true);
          }}
          isDisabled={isStreaming}
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Content>
            {item.props.label && <Label>{item.props.label}</Label>}
            {item.props.description && (
              <Description>{item.props.description}</Description>
            )}
          </Switch.Content>
        </Switch>
      ))}
    </HeroUISwitchGroup>
  );
}

export const SwitchGroup = defineComponent({
  name: "SwitchGroup",
  props: SwitchGroupSchema,
  description: "Group of switch toggles",
  component: SwitchGroupRenderer,
});
