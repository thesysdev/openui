"use client";

import { defineComponent, useIsStreaming, type ComponentRenderProps } from "@openuidev/react-lang";
import { Kpi, type KpiProps } from "../../../components/metrics/Kpi";
import { nodeProps } from "../../../shared/values";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import type { ProgressSchemaProps } from "../Progress/schema";
import type { SplitSchemaProps } from "../Split/schema";
import type { StatesSchemaProps } from "../States/schema";
import type { TrendSchemaProps } from "../Trend/schema";
import { kpiPropsSchema, type KpiSchemaProps } from "./schema";

export const KpiComponent = defineComponent({
  name: "Kpi",
  props: kpiPropsSchema,
  description:
    'Stat tile, only inside Kpis. value is a number, shown with format and its change vs previous (the same measure one period earlier), or a short text such as a plan, status or version (no format or previous; tone colours its status dot). hint is a short subtitle such as "Last 12 weeks". chart is at most one of: Trend(weekly) for a sparkline, Progress(50000) for progress toward a target, Split([{label: "Web", value: 310}, {label: "App", value: 190}]) for what a total is made of, States(["good", "good", "warning"]) for a status per period.',
  component: KpiView,
});

/** The tile's one small chart, as the Kpi props it sets. */
function chartProps(chart: unknown): Partial<KpiProps> {
  switch ((chart as { typeName?: string } | null)?.typeName) {
    case "Trend": {
      const trend = nodeProps<TrendSchemaProps>(chart);
      return { trend: trend?.values, trendPrevious: trend?.previous };
    }
    case "Progress":
      return { target: nodeProps<ProgressSchemaProps>(chart)?.target };
    case "Split":
      return { split: nodeProps<SplitSchemaProps>(chart)?.parts };
    case "States":
      return { states: nodeProps<StatesSchemaProps>(chart)?.states };
    default:
      return {};
  }
}

function KpiView({ props }: ComponentRenderProps<KpiSchemaProps>) {
  const streaming = useIsStreaming();
  const { chart, ...rest } = props;
  return <Kpi {...rest} {...chartProps(chart)} streaming={streaming} />;
}

// Every schema field reaches Kpi (chart is read into the small chart's props here).
export type KpiSchemaCovered = Covered<SchemaCoverage<KpiSchemaProps, KpiProps, "chart">>;
