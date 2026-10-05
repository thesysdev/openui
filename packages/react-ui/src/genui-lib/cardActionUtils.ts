import type { ActionPlan } from "@openuidev/react-lang";
import { ACTION_STEPS, BuiltinActionType } from "@openuidev/react-lang";

export type LegacyCardAction = { type: string; params: Record<string, unknown> };

/** Legacy action objects: `{ type?, params? }`, `{ type: "open_url", url }`, `{ type: "continue_conversation", context }`. */
type LegacyActionInput = {
  type?: string;
  params?: Record<string, unknown>;
  url?: string;
  context?: unknown;
};

/** Item context as text, for a ToAssistant step whose `context` is a string or absent. */
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
 * - `ActionPlan` (`{ steps }`): returns a copy whose ToAssistant steps carry the
 *   item context in `context`: appended to a string, added as `selectedItem` to
 *   an object; other steps untouched.
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
        if (step.context === undefined || step.context === "") return { ...step, context: suffix };
        if (isPlainObject(step.context)) {
          return { ...step, context: { ...step.context, selectedItem: context } };
        }
        const existing =
          typeof step.context === "string" ? step.context : JSON.stringify(step.context);
        return { ...step, context: `${existing}\n${suffix}` };
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
