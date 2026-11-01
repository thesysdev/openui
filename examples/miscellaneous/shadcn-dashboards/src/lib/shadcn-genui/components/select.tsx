"use client";

import {
  SelectContent,
  SelectTrigger,
  SelectValue,
  Select as ShadcnSelect,
  SelectItem as ShadcnSelectItem,
} from "@/components/ui/select";
import { defineComponent, reactive, useIsStreaming, useStateField } from "@openuidev/react-lang";
import { z } from "zod";
import { asArray, isElement } from "../format";
import { rulesSchema } from "../rules";

export const SelectItem = defineComponent({
  name: "SelectItem",
  props: z.object({ value: z.string(), label: z.string() }),
  description: "One option of a Select.",
  component: () => null,
});

// A filter: bound to a $variable (its last argument), which Query arguments can read, so
// picking an option re-runs those queries.
export const Select = defineComponent({
  name: "Select",
  props: z.object({
    name: z.string(),
    items: z.array(SelectItem.ref),
    placeholder: z.string().optional(),
    rules: rulesSchema,
    value: reactive(z.string().optional()),
  }),
  description:
    'Dropdown filter. Bind it to a $variable and pass that variable to Query arguments: Select("range", items, null, null, $months).',
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const field = useStateField(props.name, props.value);
    const items = asArray(props.items)
      .filter(isElement)
      .map((item) => ({
        value: String(item.props.value ?? ""),
        label: String(item.props.label ?? ""),
      }))
      .filter((item) => item.value);
    return (
      // The wrapper keeps the trigger its own width inside a Stack row.
      <div className="flex">
        <ShadcnSelect
          name={field.name}
          value={field.value == null ? "" : String(field.value)}
          onValueChange={(value) => field.setValue(value)}
          disabled={isStreaming}
        >
          <SelectTrigger className="w-auto min-w-44 bg-background" size="sm">
            <SelectValue placeholder={props.placeholder ?? "Select…"} />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            {items.map((item) => (
              <ShadcnSelectItem key={item.value} value={item.value}>
                {item.label || item.value}
              </ShadcnSelectItem>
            ))}
          </SelectContent>
        </ShadcnSelect>
      </div>
    );
  },
});
