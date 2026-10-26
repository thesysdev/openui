import type { TrackerItem } from "../../core/schemas";

export interface TrackerProps {
  /** One block per day or check, in order. */
  items: TrackerItem[];
  /** One line above the strip, e.g. "96.8% shipped within 48 hours". */
  summary?: string;
  className?: string;
}
