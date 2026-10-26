import type { Goal } from "../../../core/schemas";

export interface GoalPaceProps {
  goal: Goal;
  className?: string;
}

/** Whether the period is on pace for its goal. */
export type PaceTone = "good" | "warn" | "bad";
