"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import clsx from "clsx";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import { filterBarPropsSchema, type FilterBarProps } from "./schema";

function FilterBarRenderer({ props, renderNode }: ComponentRenderProps<FilterBarProps>) {
  const children = props.children;
  const rightChildren = props.rightChildren;

  return (
    <div
      className={clsx(
        `${DASHBOARD_CLASS_PREFIX}-filter-bar`,
        props.compact && `${DASHBOARD_CLASS_PREFIX}-filter-bar--compact`,
      )}
    >
      <div
        className={`${DASHBOARD_CLASS_PREFIX}-filter-bar__side ${DASHBOARD_CLASS_PREFIX}-filter-bar__side--left`}
      >
        {renderNode(children)}
      </div>
      {rightChildren.length ? (
        <div
          className={`${DASHBOARD_CLASS_PREFIX}-filter-bar__side ${DASHBOARD_CLASS_PREFIX}-filter-bar__side--right`}
        >
          {renderNode(rightChildren)}
        </div>
      ) : null}
    </div>
  );
}

export const FilterBarComponent = defineComponent({
  name: "FilterBar",
  props: filterBarPropsSchema,
  description: "",
  component: FilterBarRenderer,
});
