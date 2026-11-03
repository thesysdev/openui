"use client";

import { toolImplementations } from "@/lib/tools";
import { openuiDashboardLibrary } from "@openuidev/dashboard-kit/lib";
import {
  useDetailedView,
  useThread,
  type AssistantMessage,
  type Message,
} from "@openuidev/react-headless";
import {
  buildMessage,
  BuiltinActionType,
  mergeStatements,
  parseMessage,
  Renderer,
  type ActionEvent,
} from "@openuidev/react-lang";
import { DetailedViewPanel, MarkDownRenderer } from "@openuidev/react-ui";
import { useCallback, useEffect, useMemo, useRef } from "react";

const STATEMENT = /^[a-zA-Z_$][\w$]*\s*=/;
// A closed fence, or the still-open last fence of a streaming reply.
const FENCE = /```[\w-]*\n([\s\S]*?)(?:```|$)/g;

/** A reply with no fence still counts as a program when most of its lines are statements. */
function isBareProgram(text: string): boolean {
  const lines = text.split("\n").filter((line) => line.trim());
  const statements = lines.filter((line) => STATEMENT.test(line.trim())).length;
  return lines.length > 0 && statements / lines.length > 0.7;
}

/** Splits an inline-mode reply into the chat text and the openui-lang program (or patch). */
function splitReply(reply: string): { text: string; code: string } {
  const blocks = [...reply.matchAll(FENCE)].map((match) => match[1]!.trim());
  if (blocks.length) return { text: reply.replace(FENCE, "").trim(), code: blocks.join("\n") };
  return isBareProgram(reply) ? { text: "", code: reply.trim() } : { text: reply.trim(), code: "" };
}

const codeOf = (message: Message) =>
  message.role === "assistant" && typeof message.content === "string"
    ? splitReply(parseMessage(message.content).content).code
    : "";

/** The dashboard's title from its DashboardHeader, for the chat card and the panel header. */
function dashboardTitle(program: string): string {
  return program.match(/DashboardHeader\(\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "Dashboard";
}

/**
 * Renders an assistant reply: its text in the chat, and its dashboard in
 * AgentInterface's detailed-view side panel behind a card. In edit mode a reply
 * may hold only the statements that changed, so each program is merged onto the
 * one before it in the thread. The panel opens on its own when a new reply with
 * a dashboard arrives; the card's button opens or closes it afterwards.
 */
export function DashboardMessage({
  message,
  isStreaming,
}: {
  message: AssistantMessage;
  isStreaming: boolean;
}) {
  const messages = useThread((s) => s.messages);
  const processMessage = useThread((s) => s.processMessage);
  const updateMessage = useThread((s) => s.updateMessage);
  const { isActive, open, toggle } = useDetailedView(message.id);

  // Stored replies carry the reply text, plus the filter state after a change.
  const { content, context, attributes } = useMemo(
    () => parseMessage(message.content ?? "", { streaming: isStreaming }),
    [message.content, isStreaming],
  );
  const initialState = Array.isArray(context) ? context[0] : undefined;
  const { text, code } = useMemo(() => splitReply(content), [content]);

  // The dashboard as it stands after this reply: every earlier program, then this patch.
  const program = useMemo(() => {
    if (!code) return "";
    const earlier = messages
      .slice(
        0,
        messages.findIndex((m) => m.id === message.id),
      )
      .map(codeOf)
      .filter(Boolean);
    const base = earlier.reduce((merged, patch) => mergeStatements(merged, patch), "");
    return base ? mergeStatements(base, code) : code;
  }, [messages, message.id, code]);

  // Open the panel once for a reply that arrives live, not for replies loaded from history.
  const arrivedLive = useRef(isStreaming);
  const opened = useRef(false);
  useEffect(() => {
    if (arrivedLive.current && program && !opened.current) {
      opened.current = true;
      open();
    }
  }, [program, open]);

  const handleStateUpdate = useCallback(
    (state: Record<string, unknown>) => {
      const hasState = Object.keys(state).length > 0;
      const stored = buildMessage({ content, attributes, context: hasState ? [state] : undefined });
      updateMessage({ ...message, content: stored });
    },
    [content, attributes, message, updateMessage],
  );

  // Same routing as AgentInterface's own GenUI messages: a button press becomes a user turn.
  const handleAction = useCallback(
    (event: ActionEvent) => {
      if (event.type === BuiltinActionType.ContinueConversation) {
        const context = [`User clicked: ${event.humanFriendlyMessage}`, event.formState ?? {}];
        processMessage({
          role: "user",
          content: buildMessage({ content: event.humanFriendlyMessage, context }),
        });
      } else if (event.type === BuiltinActionType.OpenUrl) {
        const url = event.params?.["url"];
        if (typeof url === "string") window.open(url, "_blank");
      }
    },
    [processMessage],
  );

  if (!text && !program) return null;
  const title = dashboardTitle(program);

  return (
    // AgentInterface sizes the latest message's element to anchor scrolling, so the parts sit inside it.
    <div className="dashboard-message">
      {text && <MarkDownRenderer textMarkdown={text} />}
      {program && (
        <div className="dashboard-message-card">
          <div>
            <div className="dashboard-message-card__title">{title}</div>
            <div className="dashboard-message-card__status">
              {isStreaming ? "Building dashboard…" : "Dashboard"}
            </div>
          </div>
          <button type="button" className="dashboard-message-card__button" onClick={toggle}>
            {isActive ? "Close" : "Open"}
          </button>
        </div>
      )}
      {program && (
        <DetailedViewPanel viewId={message.id} title={title}>
          <div className="dashboard-message-panel">
            <Renderer
              response={program}
              library={openuiDashboardLibrary}
              isStreaming={isStreaming}
              toolProvider={toolImplementations}
              onAction={handleAction}
              onStateUpdate={handleStateUpdate}
              initialState={initialState}
            />
          </div>
        </DetailedViewPanel>
      )}
    </div>
  );
}
