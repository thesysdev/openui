"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { FilterBar, type FilterBarProps } from "../../../components/filters/FilterBar";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { filterBarPropsSchema, type FilterBarSchemaProps } from "./schema";
export const FilterBarComponent = defineComponent({
  name: "FilterBar",
  props: filterBarPropsSchema,
  description: "Sticky row of dashboard-wide filters, right after the header.",
  component: FilterBarView,
});
const typeOf = (node: unknown) => (node as { typeName?: string } | null)?.typeName ?? "";

/** Filters of one kind form a section; consecutive dropdowns cluster as one. */
const SECTION: Record<string, string> = {
  PeriodPicker: "time",
  DateRangeFilter: "time",
  SelectFilter: "dropdowns",
  MultiSelectFilter: "dropdowns",
};

/**
 * The left side of the bar in sections: when (the date control), then each
 * chip set, then the dropdowns as one tight cluster. Sections are split by a
 * small dot; filters inside a section sit close together.
 */
function sections(nodes: unknown[]): unknown[][] {
  const out: unknown[][] = [];
  let previous: string | null = null;
  for (const node of nodes) {
    const key = SECTION[typeOf(node)] ?? null;
    if (key && key === previous) out[out.length - 1]!.push(node);
    else out.push([node]);
    previous = key;
  }
  return out;
}

function FilterBarView({ props, renderNode }: ComponentRenderProps<FilterBarSchemaProps>) {
  const filters = Array.isArray(props.filters) ? props.filters : [];
  // Compare and Search are actions on the bar's right: Compare, then Search
  // last. Everything else filters, on the left, in the order written.
  const toggles = filters.filter((node) => typeOf(node) === "CompareToggle");
  const searches = filters.filter((node) => typeOf(node) === "SearchFilter");
  const others = filters.filter(
    (node) => typeOf(node) !== "CompareToggle" && typeOf(node) !== "SearchFilter",
  );
  return (
    <FilterBar
      groups={sections(others).map((group) => ({
        clustered: group.length > 1,
        children: renderNode(group),
      }))}
      others={renderNode(others)}
      toggles={renderNode(toggles)}
      searches={renderNode(searches)}
      hasActions={!!(toggles.length || searches.length)}
    />
  );
}

// Every schema field reaches FilterBar (filters are sorted into sections and rendered here).
export type FilterBarSchemaCovered = Covered<
  SchemaCoverage<FilterBarSchemaProps, FilterBarProps, "filters">
>;
