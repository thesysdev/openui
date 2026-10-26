import type { ValueFormat } from "../../../core/schemas";
import type { Panel } from "./sixTwelveGeometry";

export interface SixTwelveProps {
  weeks: Panel;
  months: Panel;
  format?: ValueFormat;
  /** Plot height in px. Default 132. */
  height?: number;
  className?: string;
}
