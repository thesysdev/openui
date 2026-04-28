"use client";

import type { AssistantMessage, ToolMessage } from "@openuidev/react-headless";
import { useThread } from "@openuidev/react-headless";
import type { ActionEvent, Library } from "@openuidev/react-lang";
import { BuiltinActionType, Renderer } from "@openuidev/react-lang";
import { useCallback, useMemo } from "react";
import {
  separateContentAndContext,
  wrapContent,
  wrapContentWithHeader,
  wrapContext,
} from "../../utils/contentParser";
import { AssistantMessageContainer } from "../Shell";
import { BehindTheScenes, ToolCallComponent } from "../ToolCall";
import { ToolResult } from "../ToolResult";

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

  const isStreaming = useMemo(() => {
    if (!isRunning) return false;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") {
        return messages[i]?.id === message.id;
      }
    }
    return false;
  }, [isRunning, messages, message.id]);

  // Separate openui-lang code from persisted form state
  const {
    content: openuiCode,
    contextString,
    contentHeader,
  } = useMemo(() => {
    if (!message.content) return { content: null, contextString: null, contentHeader: undefined };
    return separateContentAndContext(message.content);
  }, [message.content]);

  const initialState = useMemo(() => {
    if (!contextString) return undefined;
    try {
      const parsed = JSON.parse(contextString);
      if (Array.isArray(parsed) && typeof parsed[0] === "object") return parsed[0];
      if (typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      return undefined;
    } catch {
      return undefined;
    }
  }, [contextString]);

  const toolMessages = useMemo(() => {
    const result: ToolMessage[] = [];
    const msgIndex = messages.findIndex((m) => m.id === message.id);
    if (msgIndex !== -1) {
      for (let i = msgIndex + 1; i < messages.length; i++) {
        const m = messages[i];
        if (m && m.role === "tool") {
          result.push(m as ToolMessage);
        } else {
          break;
        }
      }
    }
    return result;
  }, [messages, message.id]);

  const getToolName = (toolCallId: string) => {
    const toolCall = message.toolCalls?.find((tc) => tc.id === toolCallId);
    return toolCall?.function.name;
  };

  // Persist form state into the inline-wrapped message content.
  const handleStateUpdate = useCallback(
    (state: Record<string, any>) => {
      const code = openuiCode ?? "";
      const hasState = Object.keys(state).length > 0;
      const contentPart = wrapContentWithHeader(code, contentHeader);
      const fullMessage = hasState
        ? contentPart + wrapContext(JSON.stringify([state]))
        : contentPart;
      updateMessage({ ...message, content: fullMessage });
    },
    [updateMessage, message, openuiCode, contentHeader],
  );

  // Build LLM-friendly message from action + form state, then dispatch
  const handleAction = useCallback(
    (event: ActionEvent) => {
      if (event.type === BuiltinActionType.ContinueConversation) {
        const contentPart = event.humanFriendlyMessage
          ? wrapContent(event.humanFriendlyMessage)
          : "";
        const messageCtx: (string | object)[] = [`User clicked: ${event.humanFriendlyMessage}`];
        if (event.formState) {
          messageCtx.push(event.formState);
        }
        const contextPart = wrapContext(JSON.stringify(messageCtx));
        const llmMessage = `${contentPart}${contextPart}`;

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

  const hasToolActivity =
    (message.toolCalls && message.toolCalls.length > 0) || toolMessages.length > 0;

  return (
    <AssistantMessageContainer>
      {hasToolActivity && (
        <BehindTheScenes isStreaming={isStreaming} toolCallsComplete={!!message.content}>
          {message.toolCalls?.map((toolCall, idx) => (
            <ToolCallComponent
              key={toolCall.id}
              toolCall={toolCall}
              isStreaming={isStreaming}
              toolsDone={!!message.content}
              isLast={idx === (message.toolCalls?.length ?? 0) - 1 && toolMessages.length === 0}
            />
          ))}
          {toolMessages.map((tm) => (
            <ToolResult key={tm.id} message={tm} toolName={getToolName(tm.toolCallId)} />
          ))}
        </BehindTheScenes>
      )}
      <Renderer
        response={openuiCode}
        library={library}
        isStreaming={isStreaming}
        onAction={handleAction}
        onStateUpdate={handleStateUpdate}
        initialState={initialState}
      />
    </AssistantMessageContainer>
  );
};
