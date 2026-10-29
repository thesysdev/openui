"use client";

import { defineComponent } from "@openuidev/react-lang";
import { space } from "../style";
import { GridSchema } from "./schema";

export * from "./schema";

export const Grid = defineComponent({
  name: "Grid",
  props: GridSchema,
  description: "Equal columns (default 2). With minChildWidth (px), columns drop on narrow screens.",
  component: ({ props, renderNode }) => {
    const columns = Math.min(12, Math.max(1, Math.round(props.columns ?? 2)));
    const gap = space(props.gap) ?? "12px";
    // At most `columns` columns, each at least minChildWidth wide.
    const min = props.minChildWidth ? `max(${Math.max(0, props.minChildWidth)}px, (100% - ${columns - 1} * ${gap}) / ${columns})` : null;
    return (
      <div
        className="iui-grid"
        style={{
          gap,
          gridTemplateColumns: min ? `repeat(auto-fill, minmax(min(100%, ${min}), 1fr))` : `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {renderNode(props.children)}
      </div>
    );
  },
});
