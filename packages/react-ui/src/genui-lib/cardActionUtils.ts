import type { ActionPlan } from "@openuidev/react-lang";
import { ACTION_STEPS, BuiltinActionType } from "@openuidev/react-lang";

export type LegacyCardAction = { type: string; params: Record<string, unknown> };

/** Legacy action objects: `{ type?, params? }`, `{ type: "open_url", url }`, `{ type: "continue_conversation", context }`. */
type LegacyActionInput = {
  type?: string;
  params?: Record<string, unknown>;
  url?: string;
  context?: string;
};

/** Serialize item context for the ToAssistant `context` string (the only ActionPlan channel the executor forwards). */
function formatItemContext(context: Record<string, unknown>): string {
  return `Selected item: ${JSON.stringify(context)}`;
}

function isActionPlan(action: unknown): action is ActionPlan {
  return (
    typeof action === "object" &&
    action !== null &&
    Array.isArray((action as { steps?: unknown }).steps)
  );
}

function dropUndefined(context: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(context).filter(([, value]) => value !== undefined));
}

/**
 * Merge per-item click context (itemIndex, itemId, itemTitle, ...) into a card
 * block's `action` prop. Item context wins on
 * key clash.
 *
 * - Legacy `{ type?, params? }` (and the bare `{ url }` / `{ context }` shapes):
 *   returns `{ type, params }` with url/context/params and item context merged.
 * - `ActionPlan` (`{ steps }`): returns a copy whose ToAssistant steps get the
 *   item context appended to their `context` string (react-lang forwards only
 *   `step.context` to the host for that step type); other steps untouched.
 * - `undefined`: returns a ContinueConversation action carrying the item context.
 */
export function withItemContext(
  action: unknown,
  itemContext: Record<string, unknown>,
): ActionPlan | LegacyCardAction {
  const context = dropUndefined(itemContext);

  if (action === undefined || action === null) {
    return { type: BuiltinActionType.ContinueConversation, params: context };
  }

  if (isActionPlan(action)) {
    if (Object.keys(context).length === 0) return action;
    const suffix = formatItemContext(context);
    return {
      ...action,
      steps: action.steps.map((step) => {
        if (step.type !== ACTION_STEPS.ToAssistant) return step;
        return { ...step, context: step.context ? `${step.context}\n${suffix}` : suffix };
      }),
    };
  }

  const legacy = action as LegacyActionInput;
  return {
    type: legacy.type ?? BuiltinActionType.ContinueConversation,
    params: {
      ...(legacy.params ?? {}),
      ...(legacy.url !== undefined ? { url: legacy.url } : {}),
      ...(legacy.context ? { context: legacy.context } : {}),
      ...context,
    },
  };
}
