import type { ActionEvent } from "@openuidev/react-lang";
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
