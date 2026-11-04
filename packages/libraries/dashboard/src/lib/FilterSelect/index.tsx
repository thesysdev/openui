"use client";

import {
  type ComponentRenderProps,
  defineComponent,
  useFormName,
  useIsStreaming,
  useSetFieldValue,
  useStateField,
} from "@openuidev/react-lang";
import { FilterMultiSelect, type FilterOption, FilterSelect } from "../../components/FilterSelect";
import {
  type FilterMultiSelectProps,
  filterMultiSelectPropsSchema,
  type FilterSelectProps,
  filterSelectPropsSchema,
} from "./schema";

function normalizeOptions(
  options: Array<{ value?: string; label?: string } | any>,
): FilterOption[] {
  return options
    .map((opt) => {
      const props = opt?.props ?? opt;
      return {
        value: props?.value as string | undefined,
        label: (props?.label ?? props?.value) as string | undefined,
      };
    })
    .filter((o): o is FilterOption => !!o.value);
}

function FilterSelectRenderer({ props }: ComponentRenderProps<FilterSelectProps>) {
  const isStreaming = useIsStreaming();
  const formName = useFormName();
  const setFieldValue = useSetFieldValue();
  const field = useStateField(props.name, props.defaultValue);

  return (
    <FilterSelect
      name={field.name}
      label={props.label}
      options={normalizeOptions(props.options ?? [])}
      value={(field.value as string | undefined) ?? ""}
      placeholder={props.placeholder}
      disabled={isStreaming}
      onValueChange={(value) => {
        field.setValue(value);
        if (!field.isReactive) {
          setFieldValue(formName, "FilterSelect", `$${props.name}`, value, false);
        }
      }}
    />
  );
}

function FilterMultiSelectRenderer({ props }: ComponentRenderProps<FilterMultiSelectProps>) {
  const isStreaming = useIsStreaming();
  const formName = useFormName();
  const setFieldValue = useSetFieldValue();
  const field = useStateField(props.name, props.defaultValues ?? []);

  return (
    <FilterMultiSelect
      label={props.label}
      options={normalizeOptions(props.options ?? [])}
      values={Array.isArray(field.value) ? (field.value as string[]).filter(Boolean) : []}
      placeholder={props.placeholder}
      disabled={isStreaming}
      onValuesChange={(values) => {
        field.setValue(values);
        if (!field.isReactive) {
          setFieldValue(formName, "FilterMultiSelect", `$${props.name}`, values, false);
        }
      }}
    />
  );
}

export const FilterSelectComponent = defineComponent({
  name: "FilterSelect",
  props: filterSelectPropsSchema,
  description: "",
  component: FilterSelectRenderer,
});

export const FilterMultiSelectComponent = defineComponent({
  name: "FilterMultiSelect",
  props: filterMultiSelectPropsSchema,
  description: "",
  component: FilterMultiSelectRenderer,
});
