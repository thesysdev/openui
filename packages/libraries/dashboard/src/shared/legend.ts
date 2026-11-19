import type { ReactNode } from "react";

export type MarkShape = "circle" | "square" | "triangle" | "diamond" | "cross" | "star" | "wye";

export type LegendEntry = {
  name: string;
  color: string;
  dashed?: boolean;
  dotted?: boolean;
  line?: boolean;
  hidden?: boolean;
  shape?: MarkShape;
  /** The chart's own mark, drawn in place of the swatch (a dumbbell's ring, a connector's pill). */
  mark?: ReactNode;
};
