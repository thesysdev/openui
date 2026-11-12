"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { Heatmap, type HeatmapProps } from "../../../components/relationships/Heatmap";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { heatmapPropsSchema, type HeatmapSchemaProps } from "./schema";
export const HeatmapComponent = defineComponent({
  name: "Heatmap",
  props: heatmapPropsSchema,
  description:
    'Magnitude across two categories (weekday × hour); values[r][c], null for no data. A Show switch in the header prints the cells as Count, % of total or % of row (colouring by that reading), or nothing (None, the default); showValues true opens it on view ("count", "total" or "row"). midpoint switches to a two-pole diverging scale around it, for values with a direction (change, variance vs plan, correlation): 0 for change.',
  component: function HeatmapView({ props }: ComponentRenderProps<HeatmapSchemaProps>) {
    return <Heatmap {...props} />;
  },
});

// Every schema field reaches Heatmap.
export type HeatmapSchemaCovered = Covered<SchemaCoverage<HeatmapSchemaProps, HeatmapProps>>;
