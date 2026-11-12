import type { Dispatch, RefObject, SetStateAction } from "react";

import type { buildContainerStyle } from "../../utils/buildContainerStyle";
import type { useChartData } from "../core/useChartData";
import type { useChartHover } from "../core/useChartHover";
import type { TooltipPayload } from "../core/useTooltipPayload";
import type { useChartDimensions } from "./useChartDimensions";
import type { useChartScroll } from "./useChartScroll";

/**
 * The closed contract for the unified cartesian orchestrator return.
 *
 * `useCartesianChartOrchestrator` annotates its return with
 * `CartesianChartOrchestrator`, and `CartesianChartLayout` depends on this
 * interface instead of `ReturnType<typeof useCartesianChartOrchestrator>` (an
 * inferred shape). The payoff is two-fold:
 *   - adding a field to the orchestrator no longer *silently* widens the
 *     layout's accepted props — the layout only sees what the interface declares;
 *   - the closed return annotation makes tsc flag any drift between the
 *     orchestrator and its contract (missing or stray fields).
 *
 * One orchestrator serves both cartesian modes; `layout` is the discriminant.
 * Every slice is always present (scroll fields are inert in fit mode and vice
 * versa) so the layout reads a single flat shape. Field types are pulled from
 * the source hooks via indexed access where they originate there, so the
 * contract stays exact without re-declaring shapes. (The whole return is
 * non-generic: `useChartData` normalizes the category key to a `string`, so
 * nothing here depends on the chart's data type.)
 */

type DataModel = ReturnType<typeof useChartData>;
type HoverModel = ReturnType<typeof useChartHover>;
type ScrollModel = ReturnType<typeof useChartScroll>;
type DimensionsModel = ReturnType<typeof useChartDimensions>;
type ContainerStyle = ReturnType<typeof buildContainerStyle>;

// ── slices ──────────────────────────────────────────────────────────────────

export interface CartesianChartRefs {
  containerRef: RefObject<HTMLDivElement | null>;
  /** Scroll mode's horizontally-scrolling viewport; unused (but inert) in fit. */
  mainContainerRef: RefObject<HTMLDivElement | null>;
  legendRef: RefObject<HTMLDivElement | null>;
}

export interface ChartIdentity {
  chartId: string;
}

export interface CartesianChartData {
  catKey: DataModel["catKey"];
  allDataKeys: DataModel["allDataKeys"];
  dataKeys: DataModel["dataKeys"];
  colors: DataModel["colors"];
  transformedKeys: DataModel["transformedKeys"];
  chartConfig: DataModel["chartConfig"];
  colorMap: DataModel["colorMap"];
}

/** Geometry, minus the x-axis slice which `CartesianChartOrchestrator` lifts out. */
export type CartesianChartDimensions = Omit<DimensionsModel, "xAxis">;

/** The x-axis label layout: angle, band height, label width and line cap. */
export type ChartXAxis = DimensionsModel["xAxis"];

export interface ChartScroll {
  canScrollLeft: ScrollModel["canScrollLeft"];
  canScrollRight: ScrollModel["canScrollRight"];
  handleScroll: ScrollModel["handleScroll"];
  scrollTo: ScrollModel["scrollTo"];
}

export interface ChartHover {
  hoveredIndex: HoverModel["hoveredIndex"];
  mousePos: HoverModel["mousePos"];
  createMouseHandlers: HoverModel["createMouseHandlers"];
}

export interface ChartLegend {
  legendItems: DataModel["legendItems"];
  hiddenSeries: DataModel["hiddenSeries"];
  toggleSeries: DataModel["toggleSeries"];
  isLegendExpanded: boolean;
  setIsLegendExpanded: Dispatch<SetStateAction<boolean>>;
}

export interface ChartTooltip {
  tooltipPayload: TooltipPayload | null;
}

export interface CartesianChartStyle {
  containerStyle: ContainerStyle;
  chartStyle: DataModel["chartStyle"];
}

// ── orchestrator ──────────────────────────────────────────────────────────────

export interface CartesianChartOrchestrator {
  /** "scroll" = fixed y-axis svg + scrolling main svg; "fit" = single svg. */
  layout: "scroll" | "fit";
  refs: CartesianChartRefs;
  identity: ChartIdentity;
  data: CartesianChartData;
  dimensions: CartesianChartDimensions;
  xAxis: ChartXAxis;
  scroll: ChartScroll;
  hover: ChartHover;
  legend: ChartLegend;
  tooltip: ChartTooltip;
  style: CartesianChartStyle;
}
