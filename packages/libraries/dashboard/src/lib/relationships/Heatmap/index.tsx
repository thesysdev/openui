"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { useMemo } from "react";
import { Heatmap, type HeatmapProps } from "../../../components/relationships/Heatmap";
import { toGrid } from "../../../shared/values";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { heatmapPropsSchema, type HeatmapSchemaProps } from "./schema";
export const HeatmapComponent = defineComponent({
  name: "Heatmap",
  props: heatmapPropsSchema,
  description:
    'Magnitude across two categories (weekday × hour). rows, columns and values have one entry per cell: its row label, its column label and its value, as query rows give them: Heatmap(h.rows.day, h.rows.hour, h.rows.n). Rows and columns draw in order of first appearance; a cell left out or null is no data. A Show switch in the header prints the cells as Count, % of total or % of row (colouring by that reading), or nothing (None, the default); showValues true opens it on view ("count", "total" or "row"). midpoint switches to a two-pole diverging scale around it, for values with a direction (change, variance vs plan, correlation): 0 for change.',
  component: function HeatmapView({ props }: ComponentRenderProps<HeatmapSchemaProps>) {
    const grid = useMemo(
      () => toGrid<number>(props.rows, props.columns, props.values),
      [props.rows, props.columns, props.values],
    );
    return <Heatmap {...props} rows={grid.rows} columns={grid.columns} values={grid.cells} />;
  },
});

// Every schema field reaches Heatmap.
export type HeatmapSchemaCovered = Covered<SchemaCoverage<HeatmapSchemaProps, HeatmapProps>>;
