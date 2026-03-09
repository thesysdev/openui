"use client";

import type { ActionEvent, Library } from "@openuidev/lang-react";
import { BuiltinActionType, Renderer } from "@openuidev/lang-react";
import type { AssistantMessage, ToolMessage } from "@openuidev/react-headless";
import { useThread } from "@openuidev/react-headless";
import { useCallback, useMemo } from "react";
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

  const isStreaming = useMemo(() => {
    if (!isRunning) return false;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") {
        return messages[i]?.id === message.id;
      }
    }
    return false;
  }, [isRunning, messages, message.id]);

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

  const handleAction = useCallback(
    (event: ActionEvent) => {
      if (event.type === BuiltinActionType.ContinueConversation) {
        processMessage({
          role: "user",
          content: event.llmFriendlyMessage ?? event.humanFriendlyMessage,
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
        response={message.content ?? null}
        library={library}
        isStreaming={isStreaming}
        onAction={handleAction}
      />
    </AssistantMessageContainer>
  );
};
