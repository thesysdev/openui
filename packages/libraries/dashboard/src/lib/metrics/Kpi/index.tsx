"use client";

import { defineComponent, useIsStreaming, type ComponentRenderProps } from "@openuidev/react-lang";
import {
  Kpi,
  type KpiProgress,
  type KpiProps,
  type KpiSplit,
  type KpiStates,
  type KpiTrend,
} from "../../../components/metrics/Kpi";
import { nodeProps, toNumbers, toStrings } from "../../../shared/values";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { kpiPropsSchema, type KpiSchemaProps } from "./schema";

export const KpiComponent = defineComponent({
  name: "Kpi",
  props: kpiPropsSchema,
  description:
    'Stat tile, only inside Kpis. value is a number, shown with format and its change vs previous (the same measure one period earlier), or a short text such as a plan, status or version (no format or previous; tone colours its status dot). hint is a short subtitle such as "Paid plans only". chart is at most one of: Trend(weekly) for a sparkline, Progress(50000) for progress toward a target, Split(["Web", "App"], [310, 190]) for what a total is made of, States(["good", "good", "warning"]) for a status per period.',
  component: KpiView,
});

/** The tile's one small chart, as the Kpi props it sets. */
function chartProps(chart: unknown): Partial<KpiProps> {
  switch ((chart as { typeName?: string } | null)?.typeName) {
    case "Trend": {
      const trend = nodeProps<KpiTrend>(chart);
      return { trend: trend?.values, trendPrevious: trend?.previous };
    }
    case "Progress":
      return { target: nodeProps<KpiProgress>(chart)?.target };
    case "Split": {
      const split = nodeProps<KpiSplit>(chart);
      const values = toNumbers(split?.values);
      return {
        split: toStrings(split?.labels).map((label, i) => ({ label, value: values[i] ?? 0 })),
      };
    }
    case "States":
      return { states: nodeProps<KpiStates>(chart)?.states };
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
