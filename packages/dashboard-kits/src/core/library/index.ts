// openui-lang definitions of the blocks both kits share: each wraps a plain
// React component from ../components with the props schema the model writes
// against and the loading state while its Query runs.

export { ActionCards } from "../../blocks/ActionCards/ActionCards.definition";
export { BarList } from "../../blocks/BarList/BarList.definition";
export { BulletList } from "../../blocks/BulletList/BulletList.definition";
export { CohortGrid } from "../../blocks/CohortGrid/CohortGrid.definition";
export { ConversionFunnel } from "../../blocks/ConversionFunnel/ConversionFunnel.definition";
export { DataStatus } from "../../blocks/DataStatus/DataStatus.definition";
export { DriverCards } from "../../blocks/DriverCards/DriverCards.definition";
export { HeroMetric } from "../../blocks/HeroMetric/HeroMetric.definition";
export { InsightList } from "../../blocks/InsightList/InsightList.definition";
export { KpiStrip } from "../../blocks/KpiStrip/KpiStrip.definition";
export { Pending } from "../../blocks/Pending/Pending.definition";
export { RuleChips } from "../../blocks/RuleChips/RuleChips.definition";
export { ShareBar } from "../../blocks/ShareBar/ShareBar.definition";
export { ColumnChart } from "../../charts/ColumnChart/ColumnChart.definition";
export { GoalPace } from "../../charts/GoalPace/GoalPace.definition";
export { HeatGrid } from "../../charts/HeatGrid/HeatGrid.definition";
export { VarianceWalk } from "../../charts/ProfitWaterfall/VarianceWalk.definition";
export { Tracker } from "../../charts/Tracker/Tracker.definition";
export { TrendChart } from "../../charts/TrendChart/TrendChart.definition";
export { createKitLibrary } from "./create-kit-library";
export type { CardSlot, KitComponent, KitLibraryDefinition } from "./create-kit-library";
