"use client";

import { useDashboardPin } from "@/context/DashboardPinContext";
import type { AssistantMessage, ToolMessage } from "@openuidev/react-headless";
import { useThread } from "@openuidev/react-headless";
import type { McpClientLike } from "@openuidev/react-lang";
import { BuiltinActionType, Renderer } from "@openuidev/react-lang";
import {
  BehindTheScenes,
  MarkDownRenderer,
  Shell,
  ToolCallComponent,
  ToolResult,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

function isPureCode(response: string): boolean {
  const trimmed = response.trim();
  if (/```/.test(trimmed)) return false;
  const lines = trimmed.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return false;
  const statementPattern = /^[a-zA-Z_$][\w$]*\s*=/;
  const statementCount = lines.filter((line) => statementPattern.test(line.trim())).length;
  return statementCount / lines.length > 0.7;
}

function extractCodeOnly(response: string): string | null {
  const fenceRegex = /```[\w-]*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  match = fenceRegex.exec(response);
  while (match !== null) {
    blocks.push(match[1].trim());
    match = fenceRegex.exec(response);
  }

  if (blocks.length > 0) return blocks.join("\n");

  const unclosedMatch = response.match(/```[\w-]*\n([\s\S]*)$/);
  if (unclosedMatch) return unclosedMatch[1].trim() || null;

  if (isPureCode(response)) return response;
  return null;
}

function extractText(response: string): string {
  const withoutFences = response.replace(/```[\w-]*\n[\s\S]*?```/g, "").trim();
  const withoutUnclosed = withoutFences.replace(/```[\w-]*\n[\s\S]*$/g, "").trim();
  if (withoutUnclosed && isPureCode(withoutUnclosed)) return "";
  return withoutUnclosed;
}

export function DashboardAssistantMessage({
  message,
  toolProvider,
}: {
  message: AssistantMessage;
  toolProvider?: McpClientLike | null;
}) {
  const messages = useThread((state) => state.messages);
  const isRunning = useThread((state) => state.isRunning);
  const processMessage = useThread((state) => state.processMessage);
  const { pinnedDashboard, pinDashboard, unpinDashboard } = useDashboardPin();

  const toolMessages = useMemo(() => {
    const result: ToolMessage[] = [];
    const messageIndex = messages.findIndex((item) => item.id === message.id);
    if (messageIndex === -1) return result;

    for (let i = messageIndex + 1; i < messages.length; i++) {
      const current = messages[i];
      if (current?.role === "tool") {
        result.push(current as ToolMessage);
      } else {
        break;
      }
    }
    return result;
  }, [messages, message.id]);

  const isStreaming = useMemo(() => {
    if (!isRunning) return false;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") return messages[i]?.id === message.id;
    }
    return false;
  }, [isRunning, message.id, messages]);

  const code = useMemo(() => extractCodeOnly(message.content ?? ""), [message.content]);
  const markdownText = useMemo(() => extractText(message.content ?? ""), [message.content]);
  const isPinned = pinnedDashboard?.messageId === message.id;

  const getToolName = (toolCallId: string) => {
    const toolCall = message.toolCalls?.find((entry) => entry.id === toolCallId);
    return toolCall?.function.name;
  };

  const handlePinToggle = () => {
    if (!code) return;
    if (isPinned) {
      unpinDashboard();
      return;
    }
    pinDashboard(code, message.id);
  };

  const hasToolActivity = (message.toolCalls?.length ?? 0) > 0 || toolMessages.length > 0;

  return (
    <Shell.AssistantMessageContainer>
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
          {toolMessages.map((toolMessage) => (
            <ToolResult
              key={toolMessage.id}
              message={toolMessage}
              toolName={getToolName(toolMessage.toolCallId)}
            />
          ))}
        </BehindTheScenes>
      )}

      {markdownText ? (
        <MarkDownRenderer
          textMarkdown={markdownText}
          className="openui-copilot-shell-thread-message-assistant__text"
        />
      ) : null}

      {code ? (
        <div className="tangential-inline-dashboard">
          <div className="tangential-inline-dashboard__actions">
            <button
              className={`tangential-pin-btn ${isPinned ? "active" : ""}`}
              onClick={handlePinToggle}
            >
              {isPinned ? "Remove pin" : "Pin"}
            </button>
          </div>
          <Renderer
            response={code}
            library={openuiLibrary}
            isStreaming={isStreaming}
            toolProvider={toolProvider ?? undefined}
            onAction={(event) => {
              if (event.type === BuiltinActionType.ContinueConversation) {
                const text = event.humanFriendlyMessage || "";
                if (text) {
                  processMessage({ role: "user", content: text });
                }
              }
            }}
          />
        </div>
      ) : null}
    </Shell.AssistantMessageContainer>
  );
}
