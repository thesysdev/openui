"use client";

import { defineComponent, useIsStreaming, type ComponentRenderProps } from "@openuidev/react-lang";
import { Kpi, type KpiProps } from "../../../components/metrics/Kpi";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { kpiPropsSchema, type KpiSchemaProps } from "./schema";

export const KpiComponent = defineComponent({
  name: "Kpi",
  props: kpiPropsSchema,
  description:
    'Stat tile, only inside Kpis. value is a number (with format and change vs previous) or a short text such as a top plan, status or version (no format or previous; tone colours a status dot). hint is a short subtitle such as "Last 12 weeks". A number tile can carry one small chart: trend (8–13 points) draws a sparkline (trendPrevious dashed under compare); target draws progress toward a goal; split [{label, value}] shows what a total is made of (≤3 parts, for totals only, never rates or averages); states ("good" | "warning" | "bad" per period) draws a status strip. Give at most one; if several are given, states wins, then split, then target, then trend. target is for one headline number; several targets in a card are Goals. split shows the parts of this tile\'s total; a card about composition is a SegmentedBar.',
  component: KpiView,
});

function KpiView({ props }: ComponentRenderProps<KpiSchemaProps>) {
  const streaming = useIsStreaming();
  return <Kpi {...props} streaming={streaming} />;
}

// Every schema field reaches Kpi.
export type KpiSchemaCovered = Covered<SchemaCoverage<KpiSchemaProps, KpiProps>>;
