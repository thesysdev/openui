import type { BurnInput } from "./burnGeometry";

export interface BurnDownProps extends BurnInput {
  /** Over pace, under pace, or on track: colours the line. */
  status: "under" | "on_track" | "over";
  /** For a budget, spending past the line is the risk: over pace draws in the bad tone. */
  overIsBad?: boolean;
  /** Plot height in px. Default 44. */
  height?: number;
  className?: string;
}
