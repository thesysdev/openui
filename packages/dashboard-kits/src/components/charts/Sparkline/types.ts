import type { Tone } from "../../../core/format";

export interface SparklineProps {
  /** Recent values, oldest first. Two or more draw a line. */
  values: number[];
  /**
   * @deprecated Ignored: sparklines always draw in the accent, and the delta
   * beside one says whether the change is good.
   */
  tone?: Tone;
  /** Height in px. The width fills the container. Default 36. */
  height?: number;
  /** Glide to new values when the data changes. Default true. */
  isAnimationActive?: boolean;
  className?: string;
}
