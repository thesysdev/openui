"use client";

// Client entry. Two layers, as in react-ui: plain React components (charts and
// blocks, typed props, no openui-lang) and their openui-lang definitions for a
// kit library. Each kit's own components and library live in
// `@openuidev/dashboard-kits/ecommerce` and `@openuidev/dashboard-kits/analytics`.

// openui-lang definitions and the library factory.
export {
  ActionCards,
  BarList,
  BulletList,
  CohortGrid,
  ColumnChart,
  ConversionFunnel,
  DataStatus,
  DriverCards,
  GoalPace,
  HeatGrid,
  HeroMetric,
  InsightList,
  KpiStrip,
  RuleChips,
  ShareBar,
  Tracker,
  TrendChart,
  VarianceWalk,
  createKitLibrary,
} from "./core/library";
export type { CardSlot, KitComponent, KitLibraryDefinition } from "./core/library";

// Plain React components, for use outside openui-lang.
export { BarList as BarListView } from "./blocks/BarList";
export type { BarListProps } from "./blocks/BarList";
export { CohortGrid as CohortGridView } from "./blocks/CohortGrid";
export type { CohortGridProps } from "./blocks/CohortGrid";
export { ConversionFunnel as ConversionFunnelView } from "./blocks/ConversionFunnel";
export type { ConversionFunnelProps } from "./blocks/ConversionFunnel";
export { HeroMetric as HeroMetricView } from "./blocks/HeroMetric";
export type { HeroMetricProps } from "./blocks/HeroMetric";
export { InsightList as InsightListView } from "./blocks/InsightList";
export type { InsightListProps } from "./blocks/InsightList";
export { KpiStrip as KpiStripView } from "./blocks/KpiStrip";
export type { KpiStripProps } from "./blocks/KpiStrip";
export { ShareBar as ShareBarView } from "./blocks/ShareBar";
export type { ShareBarProps } from "./blocks/ShareBar";
export { ColumnChart as ColumnChartView } from "./charts/ColumnChart";
export type { ColumnChartProps } from "./charts/ColumnChart";
export { GoalPace as GoalPaceView } from "./charts/GoalPace";
export type { GoalPaceProps } from "./charts/GoalPace";
export { HeatGrid as HeatGridView } from "./charts/HeatGrid";
export type { HeatGridProps } from "./charts/HeatGrid";
export { Sparkline } from "./charts/Sparkline";
export type { SparklineProps } from "./charts/Sparkline";
export { Tracker as TrackerView } from "./charts/Tracker";
export type { TrackerProps } from "./charts/Tracker";
export { TrendChart as TrendChartView } from "./charts/TrendChart";
export type { TrendChartProps, TrendChartSeries } from "./charts/TrendChart";

export type { GalleryDashboard, KitDefinition, KitTool } from "./core/kit";
export { createToolProvider } from "./core/tool-provider";
export type { ToolCall } from "./core/tool-provider";
