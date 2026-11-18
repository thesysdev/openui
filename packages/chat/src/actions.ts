import type { ActionEvent, ActionPlan, ActionStep } from "@openuidev/lang-core";
import { BuiltinActionType } from "@openuidev/lang-core";

/** Prefix of every action id this package puts on a card. */
export const OPENUI_ACTION_PREFIX = "openui:";

const BUTTON_PREFIX = `${OPENUI_ACTION_PREFIX}b:`;
const SELECT_PREFIX = `${OPENUI_ACTION_PREFIX}s:`;
// Slack caps a button value at 2000 characters and an action id at 255
const MAX_VALUE = 2000;
const MAX_LABEL = 200;

/** What a button does once the card is posted: a message for the assistant, a link, or a custom action. */
export type ButtonIntent =
  | { kind: "message"; message: string; context?: unknown }
  | { kind: "url"; url: string }
  | { kind: "custom"; name: string; params: Record<string, unknown> };

/**
 * Reduces an evaluated `action` prop to what a static chat message can do.
 * `@Set`, `@Reset` and `@Run` need a live runtime, so they are skipped;
 * a button left with nothing to do sends its label to the assistant.
 */
export function buttonIntent(action: unknown, label: string): ButtonIntent {
  for (const step of actionSteps(action)) {
    switch (step.type) {
      case "continue_conversation":
        return { kind: "message", message: step.message || label, context: step.context };
      case "open_url":
        if (step.url) return { kind: "url", url: step.url };
        break;
      case "custom_action":
        return { kind: "custom", name: step.name, params: step.params };
    }
  }
  return { kind: "message", message: label };
}

function actionSteps(action: unknown): ActionStep[] {
  if (!action || typeof action !== "object") return [];
  const plan = action as Partial<ActionPlan> & Record<string, unknown>;
  if (Array.isArray(plan.steps)) return plan.steps;
  // Legacy `{ type, ... }` action objects
  if (plan["type"] === "open_url" && typeof plan["url"] === "string") {
    return [{ type: "open_url", url: plan["url"] }];
  }
  if (plan["type"] === "continue_conversation") {
    return [{ type: "continue_conversation", message: "", context: plan["context"] }];
  }
  if (typeof plan["type"] === "string") {
    const params = plan["params"];
    return [
      {
        type: "custom_action",
        name: plan["type"],
        params: params && typeof params === "object" ? (params as Record<string, unknown>) : {},
      },
    ];
  }
  return [];
}

type EncodedButton = { t: string; m: string; p?: Record<string, unknown> };

/** Serializes a message or custom intent into a button value. */
export function encodeButtonValue(intent: Exclude<ButtonIntent, { kind: "url" }>): string {
  const payload: EncodedButton =
    intent.kind === "message"
      ? {
          t: BuiltinActionType.ContinueConversation,
          m: intent.message,
          ...(intent.context !== undefined ? { p: { context: intent.context } } : {}),
        }
      : { t: intent.name, m: "", p: intent.params };
  let value = JSON.stringify(payload);
  if (value.length <= MAX_VALUE) return value;
  // Too long for the platform: drop the hidden data, then trim the message
  delete payload.p;
  value = JSON.stringify(payload);
  while (value.length > MAX_VALUE) {
    payload.m = payload.m.slice(0, payload.m.length - (value.length - MAX_VALUE) - 1);
    value = JSON.stringify(payload);
  }
  return value;
}

export function buttonActionId(index: number): string {
  return `${BUTTON_PREFIX}${index}`;
}

export function selectActionId(index: number, label: string): string {
  return `${SELECT_PREFIX}${index}:${encodeURIComponent(label.slice(0, MAX_LABEL)).slice(0, MAX_LABEL)}`;
}

/** The fields of a Chat SDK `ActionEvent` this package reads. */
export interface ChatActionLike {
  actionId: string;
  value?: string;
}

/**
 * Turns a Chat SDK action from an OpenUI card into an OpenUI `ActionEvent`,
 * or null when the action did not come from an OpenUI card.
 *
 * ```ts
 * bot.onAction(async (event) => {
 *   const action = parseChatAction(event);
 *   if (action?.type === "continue_conversation") await reply(event.thread, action.humanFriendlyMessage);
 * });
 * ```
 */
export function parseChatAction(event: ChatActionLike): ActionEvent | null {
  const { actionId, value } = event;
  if (actionId.startsWith(BUTTON_PREFIX)) {
    if (!value) return null;
    let payload: Partial<EncodedButton>;
    try {
      payload = JSON.parse(value) as Partial<EncodedButton>;
    } catch {
      return null;
    }
    if (typeof payload.t !== "string") return null;
    return {
      type: payload.t,
      params: payload.p ?? {},
      humanFriendlyMessage: typeof payload.m === "string" ? payload.m : "",
    };
  }
  if (actionId.startsWith(SELECT_PREFIX)) {
    const rest = actionId.slice(SELECT_PREFIX.length);
    const label = safeDecode(rest.slice(rest.indexOf(":") + 1));
    const picked = value ?? "";
    return {
      type: BuiltinActionType.ContinueConversation,
      params: { label, value: picked },
      humanFriendlyMessage: label ? `${label}: ${picked}` : picked,
    };
  }
  return null;
}

function safeDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}
