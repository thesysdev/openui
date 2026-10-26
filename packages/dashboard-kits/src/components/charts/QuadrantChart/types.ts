export interface QuadrantPoint {
  name: string;
  x: number;
  y: number;
  /** Bubble area follows it. */
  size: number;
  /** A change to show in the tooltip footer, e.g. "+3.2 pts". */
  change?: { text: string; good: boolean };
}

export interface QuadrantAxis {
  title: string;
  domain: [number, number];
  ticks: number[];
  format: (value: number) => string;
}

/** Quadrants by which side of each split a point falls: x then y. */
export type Quadrant = "highHigh" | "lowHigh" | "highLow" | "lowLow";

export interface QuadrantChartProps {
  points: QuadrantPoint[];
  x: QuadrantAxis;
  y: QuadrantAxis;
  /** What each quadrant means, e.g. { highHigh: "Core", lowLow: "Review or retire", … }. */
  quadrants: Record<Quadrant, string>;
  /** Where the quadrants split; the medians by default. */
  split?: { x?: number; y?: number };
  /** Tooltip rows for a point beyond its name. */
  describe: (point: QuadrantPoint) => { name: string; value: string }[];
  /** Read out the label under the chart, e.g. "Bubble size: users". */
  sizeLabel?: string;
  /** Plot height in px. Default 340. */
  height?: number;
  /** Glide the bubbles when the data changes. Default true. */
  isAnimationActive?: boolean;
  className?: string;
}
