"use client";

import type { AssistantMessage } from "@openuidev/react-headless";
import { useThread } from "@openuidev/react-headless";
import type { ActionEvent, Library } from "@openuidev/react-lang";
import { buildMessage, BuiltinActionType, Renderer } from "@openuidev/react-lang";
import { useCallback, useMemo } from "react";
import { getLastAssistantMessageId, readMessage } from "../../utils/messages";
import { AssistantMessageContainer } from "./AssistantMessageContainer";
import { buildActionUserMessage } from "./utils/actionMessage";

/** Renders the OpenUI-Lang response for one assistant message. */
export const GenUIAssistantMessage = ({
  message,
  library,
}: {
  message: AssistantMessage;
  library: Library;
}) => {
  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const processMessage = useThread((s) => s.processMessage);
  const updateMessage = useThread((s) => s.updateMessage);

  const lastAssistantId = useMemo(() => getLastAssistantMessageId(messages), [messages]);
  const isStreaming = isRunning && lastAssistantId === message.id;

  // Strip the marker lines and separate any persisted form-state.
  const { content, context, attributes } = useMemo(
    () =>
      message.content
        ? readMessage(message.content, isStreaming)
        : { content: null, context: null, attributes: {} },
    [message.content, isStreaming],
  );

  const initialState = useMemo(() => {
    if (Array.isArray(context) && typeof context[0] === "object") return context[0];
    if (context && typeof context === "object" && !Array.isArray(context)) return context;
    return undefined;
  }, [context]);

  // Persist form state, keeping the content attributes, e.g. ?libraryVersion=0.5&thesys=true
  const handleStateUpdate = useCallback(
    (state: Record<string, any>) => {
      const hasState = Object.keys(state).length > 0;
      const fullMessage = buildMessage({
        content: content ?? "",
        attributes,
        context: hasState ? [state] : undefined,
      });
      updateMessage({ ...message, content: fullMessage });
    },
    [updateMessage, message, content, attributes],
  );

  // Build LLM-friendly message from action + form state, then dispatch
  const handleAction = useCallback(
    (event: ActionEvent) => {
      if (event.type === BuiltinActionType.ContinueConversation) {
        const llmMessage = buildActionUserMessage(event);

        processMessage({
          role: "user",
          content: llmMessage,
        });
      } else if (event.type === BuiltinActionType.OpenUrl) {
        const url = event.params?.["url"] as string | undefined;
        if (typeof window !== "undefined" && url) {
          window.open(url, "_blank");
        }
      }
    },
    [processMessage],
  );

  return (
    <AssistantMessageContainer>
      {content && (
        <Renderer
          response={content}
          library={library}
          isStreaming={isStreaming}
          onAction={handleAction}
          onStateUpdate={handleStateUpdate}
          initialState={initialState}
        />
      )}
    </AssistantMessageContainer>
  );
};
