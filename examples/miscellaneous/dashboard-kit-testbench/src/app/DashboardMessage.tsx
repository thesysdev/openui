"use client";

import { openuiDashboardLibrary } from "@openuidev/dashboard-kit/lib";
import { useDetailedView, useThread, type AssistantMessage } from "@openuidev/react-headless";
import {
  BuiltinActionType,
  buildMessage,
  parseMessage,
  Renderer,
  type ActionEvent,
} from "@openuidev/react-lang";
import { DetailedViewPanel } from "@openuidev/react-ui";
import { useCallback, useEffect, useMemo, useRef } from "react";

/** The dashboard's title from its DashboardHeader, for the chat card and the panel header. */
function dashboardTitle(program: string): string {
  return program.match(/DashboardHeader\(\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "Dashboard";
}

/**
 * Renders an assistant reply as a card in the chat and the dashboard itself in
 * AgentInterface's detailed-view side panel. The panel opens on its own when a new
 * reply arrives; the card's button opens or closes it afterwards.
 */
export function DashboardMessage({
  message,
  isStreaming,
}: {
  message: AssistantMessage;
  isStreaming: boolean;
}) {
  const processMessage = useThread((s) => s.processMessage);
  const updateMessage = useThread((s) => s.updateMessage);
  const { isActive, open, toggle } = useDetailedView(message.id);

  // Stored replies carry the program, plus the filter state after a change.
  const { content, context, attributes } = useMemo(
    () => parseMessage(message.content ?? "", { streaming: isStreaming }),
    [message.content, isStreaming],
  );
  const initialState = Array.isArray(context) ? context[0] : undefined;

  // Open the panel once for a reply that arrives live, not for replies loaded from history.
  const arrivedLive = useRef(isStreaming);
  const opened = useRef(false);
  useEffect(() => {
    if (arrivedLive.current && content && !opened.current) {
      opened.current = true;
      open();
    }
  }, [content, open]);

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

  if (!content) return null;
  const title = dashboardTitle(content);

  return (
    // AgentInterface sizes the latest message's element to anchor scrolling, so the card sits inside it.
    <div>
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
      <DetailedViewPanel viewId={message.id} title={title}>
        <div className="dashboard-message-panel">
          <Renderer
            response={content}
            library={openuiDashboardLibrary}
            isStreaming={isStreaming}
            onAction={handleAction}
            onStateUpdate={handleStateUpdate}
            initialState={initialState}
          />
        </div>
      </DetailedViewPanel>
    </div>
  );
}
