import { BuiltinActionType, buildMessage, type ActionEvent } from "@openuidev/react-lang";

/** The stored user turn for a continue_conversation event; context is `["User clicked: msg", formState, context?]`. */
export function buildActionUserMessage(event: ActionEvent): string {
  const messageCtx: unknown[] = [`User clicked: ${event.humanFriendlyMessage}`];
  const actionContext = event.params?.["context"];
  if (event.formState || actionContext !== undefined) {
    messageCtx.push(event.formState ?? {});
  }
  if (actionContext !== undefined) {
    messageCtx.push(actionContext);
  }
  const built = buildMessage({ content: event.humanFriendlyMessage, context: messageCtx });
  // No message: stored without the content line, e.g. "\n]]>openui:context\n[...]"
  return event.humanFriendlyMessage ? built : built.slice(built.indexOf("\n") + 1);
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
