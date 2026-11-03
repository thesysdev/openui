"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { FilterBar } from "../../components/FilterBar";
import { filterBarPropsSchema, type FilterBarProps } from "./schema";

function FilterBarRenderer({ props, renderNode }: ComponentRenderProps<FilterBarProps>) {
  return (
    <FilterBar
      compact={props.compact}
      rightChildren={props.rightChildren.length ? renderNode(props.rightChildren) : undefined}
    >
      {renderNode(props.children)}
    </FilterBar>
  );
}

export const FilterBarComponent = defineComponent({
  name: "FilterBar",
  props: filterBarPropsSchema,
  description: "",
  component: FilterBarRenderer,
});
