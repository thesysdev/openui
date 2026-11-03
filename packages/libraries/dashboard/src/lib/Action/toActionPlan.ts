import type { ActionPlan } from "@openuidev/react-lang";

/**
 * The parser accepts any value in an action slot, so a positional slip such as
 * Button("Export", "secondary") puts a string there. Only an action object is an
 * action; anything else falls back to the default of sending the label.
 */
export function toActionPlan(action: unknown): ActionPlan | undefined {
  return typeof action === "object" && action !== null ? (action as ActionPlan) : undefined;
}
