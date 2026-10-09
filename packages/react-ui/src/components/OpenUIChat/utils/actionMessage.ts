import { BuiltinActionType, type ActionEvent } from "@openuidev/react-lang";
import { wrapContent, wrapContext } from "../../../utils/sentinelParser";

/** The stored user turn for a continue_conversation event; context is `["User clicked: msg", formState, context?]`. */
export function buildActionUserMessage(event: ActionEvent): string {
  const contentPart = event.humanFriendlyMessage ? wrapContent(event.humanFriendlyMessage) : "";
  const messageCtx: unknown[] = [`User clicked: ${event.humanFriendlyMessage}`];
  const actionContext = event.params?.["context"];
  if (event.formState || actionContext !== undefined) {
    messageCtx.push(event.formState ?? {});
  }
  if (actionContext !== undefined) {
    messageCtx.push(actionContext);
  }
  return `${contentPart}${wrapContext(JSON.stringify(messageCtx))}`;
}

/** continue_conversation sends a user turn, open_url opens a tab, any other action (e.g. a custom one) goes to `onAction`. */
export function runChatAction(
  event: ActionEvent,
  send: (content: string) => void,
  onAction?: (event: ActionEvent) => void,
): void {
  if (event.type === BuiltinActionType.ContinueConversation) {
    send(buildActionUserMessage(event));
  } else if (event.type === BuiltinActionType.OpenUrl) {
    const url = event.params?.["url"] as string | undefined;
    if (typeof window !== "undefined" && url) window.open(url, "_blank");
  } else {
    onAction?.(event);
  }
}
