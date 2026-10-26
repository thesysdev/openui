import type { ValueFormat } from "../../core/schemas";

export interface HeatGridProps {
  /** One row per category, e.g. a weekday, with a value per column. */
  rows: { label: string; values: number[] }[];
  /** One label per column, e.g. "09:00". */
  columns: string[];
  /** How values read in the tooltip. Default "number". */
  format?: ValueFormat;
  /** What a value counts, for the tooltip, e.g. "events". */
  unit?: string;
  /** Cell height in px. Default 22. */
  cellHeight?: number;
  /** Cells fade in column by column on mount. Default true. */
  isAnimationActive?: boolean;
  className?: string;
}
