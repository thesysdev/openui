"use client";

import {
  type ComponentRenderProps,
  defineComponent,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/react-lang";
import { z } from "zod/v4";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/Select";
import { selectItemPropsSchema } from "./schema";

export const SelectItemComponent = defineComponent({
  name: "SelectItem",
  props: selectItemPropsSchema,
  description: "",
  component: () => null,
});

export const selectPropsSchema = z.object({
  name: z.string(),
  items: z.array(SelectItemComponent.ref),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
});

type SelectProps = z.infer<typeof selectPropsSchema>;

function SelectRenderer({ props }: ComponentRenderProps<SelectProps>) {
  const formName = useFormName();
  const getFieldValue = useGetFieldValue();
  const setFieldValue = useSetFieldValue();
  const isStreaming = useIsStreaming();

  const fieldName = props.name;
  const items = (props.items ?? []).filter((item) => item.props.value);

  const existingValue = getFieldValue(formName, fieldName) as string | undefined;
  const value = existingValue ?? props.defaultValue;

  return (
    <Select
      name={fieldName}
      value={value ?? ""}
      onValueChange={(val: string) => {
        setFieldValue(formName, "Select", fieldName, val, true);
      }}
      disabled={isStreaming}
    >
      <SelectTrigger>
        <SelectValue placeholder={props.placeholder ?? "Select..."} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item, i) => (
          <SelectItem key={i} value={item.props.value}>
            {item.props.label ?? item.props.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export const SelectComponent = defineComponent({
  name: "Select",
  props: selectPropsSchema,
  description: "",
  component: SelectRenderer,
});
