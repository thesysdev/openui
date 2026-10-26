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
} from "./genui-lib";
export type { CardSlot, KitComponent, KitLibraryDefinition } from "./genui-lib";

// Plain React components, for use outside openui-lang.
export { BarList as BarListView } from "./components/BarList";
export type { BarListProps } from "./components/BarList";
export { ColumnChart as ColumnChartView } from "./components/Charts/ColumnChart";
export type { ColumnChartProps } from "./components/Charts/ColumnChart";
export { GoalPace as GoalPaceView } from "./components/Charts/GoalPace";
export type { GoalPaceProps } from "./components/Charts/GoalPace";
export { HeatGrid as HeatGridView } from "./components/Charts/HeatGrid";
export type { HeatGridProps } from "./components/Charts/HeatGrid";
export { Sparkline } from "./components/Charts/Sparkline";
export type { SparklineProps } from "./components/Charts/Sparkline";
export { Tracker as TrackerView } from "./components/Charts/Tracker";
export type { TrackerProps } from "./components/Charts/Tracker";
export { TrendChart as TrendChartView } from "./components/Charts/TrendChart";
export type { TrendChartProps, TrendChartSeries } from "./components/Charts/TrendChart";
export { CohortGrid as CohortGridView } from "./components/CohortGrid";
export type { CohortGridProps } from "./components/CohortGrid";
export { ConversionFunnel as ConversionFunnelView } from "./components/ConversionFunnel";
export type { ConversionFunnelProps } from "./components/ConversionFunnel";
export { HeroMetric as HeroMetricView } from "./components/HeroMetric";
export type { HeroMetricProps } from "./components/HeroMetric";
export { InsightList as InsightListView } from "./components/InsightList";
export type { InsightListProps } from "./components/InsightList";
export { KpiStrip as KpiStripView } from "./components/KpiStrip";
export type { KpiStripProps } from "./components/KpiStrip";
export { ShareBar as ShareBarView } from "./components/ShareBar";
export type { ShareBarProps } from "./components/ShareBar";

export type { GalleryDashboard, KitDefinition, KitTool } from "./core/kit";
export { createToolProvider } from "./core/tool-provider";
export type { ToolCall } from "./core/tool-provider";
