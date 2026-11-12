import type { ChartData } from "../types";
import type { FunnelEdges, FunnelOrientation } from "./parts/funnelGeometry";

export type { FunnelEdges, FunnelOrientation } from "./parts/funnelGeometry";
export type FunnelChartData = ChartData;

export interface FunnelChartProps<T extends FunnelChartData> {
  /**
   * Row-shaped data, same contract as Pie/Radial: one row per funnel stage,
   * in order from the top (widest) stage to the bottom. `categoryKey` names
   * the stage-label field; `dataKey` names the numeric value field.
   */
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  /**
   * Funnel flow direction. `'horizontal'` stacks stages left→right (each a
   * full-height column); `'vertical'` stacks them top→bottom. Default
   * `'horizontal'`.
   */
  orientation?: FunnelOrientation;
  /**
   * Stage-to-stage edge shape. `'curved'` tapers smoothly between stages with
   * a bezier belly; `'straight'` uses flat trapezoid sides. Default
   * `'curved'`.
   */
  edges?: FunnelEdges;
  /**
   * Number of concentric halo rings drawn per stage — the funnel's layered
   * glow. Each outer ring is larger and fainter; the core is solid. `1`
   * disables the halo (a single solid shape). Clamped to ≥ 1. Default `3`.
   */
  layers?: number;
  /**
   * Ordered colors for the stages, top→bottom; overrides the theme palette.
   * One hue per stage (the halo is built from opacity, not extra hues).
   */
  customPalette?: string[];
  /** Show each stage's name. Default true. */
  showLabels?: boolean;
  /** Show each stage's raw value. Default true. */
  showValues?: boolean;
  /**
   * Show each stage's percentage RELATIVE TO THE FIRST STAGE (the first stage
   * is 100%) — i.e. funnel retention, NOT share of total. Default true.
   */
  showPercentage?: boolean;
  /** Show the legend (one swatch per stage); clicking toggles a stage. Default true. */
  legend?: boolean;
  /**
   * Play the entrance animation. Gates the entrance ONLY — any hover or
   * data-update motion is independent of this flag, and printing always
   * disables it.
   * Default false (streaming-safe: marks mounted while data streams in don't
   * replay staggered entrances).
   */
  isAnimationActive?: boolean;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
  className?: string;
  /**
   * Click on a stage: the original data row and its index among the currently
   * VISIBLE stages (top = 0; the index shifts if stages are hidden via the
   * legend). The row is always the original data row.
   */
  onClick?: (row: T[number], index: number) => void;
}
