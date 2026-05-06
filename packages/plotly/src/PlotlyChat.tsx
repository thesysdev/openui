"use client";
// One-line chat shell: <PlotlyChat /> wires up FullScreen, the plotlyLibrary,
// the OpenAI adapter, and PlotlyAssistantMessage with sensible defaults.
// Use the lower-level pieces (plotlyLibrary, PlotlyAssistantMessage, etc.)
// directly if you need custom message processing.

import {
  openAIMessageFormat,
  openAIReadableStreamAdapter,
  type Message,
} from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import React from "react";
import { PlotlyAssistantMessage } from "./AssistantMessage";
import { plotlyLibrary, plotlyPromptOptions } from "./library";

export interface PlotlyChatProps {
  /** API endpoint that proxies to your LLM. Receives `{ systemPrompt, messages }`
   *  and returns a streaming response. Defaults to `/api/chat`. */
  apiUrl?: string;
  /** Or supply your own message processor (overrides `apiUrl`). */
  processMessage?: (params: {
    threadId: string;
    messages: Message[];
    abortController: AbortController;
  }) => Promise<Response>;
  /** Override the system prompt fed to the LLM. Defaults to the catalog of
   *  all 47 components. */
  systemPrompt?: string;
  /** Display name shown in the chat shell header. */
  agentName?: string;
  /** Inline class on the wrapping div. */
  className?: string;
}

export function PlotlyChat({
  apiUrl = "/api/chat",
  processMessage,
  systemPrompt,
  agentName = "OpenUI × Plotly",
  className,
}: PlotlyChatProps) {
  const finalSystemPrompt = React.useMemo(
    () => systemPrompt ?? plotlyLibrary.prompt(plotlyPromptOptions),
    [systemPrompt],
  );

  const finalProcessMessage = React.useMemo(() => {
    if (processMessage) return processMessage;
    return async ({
      messages,
      abortController,
    }: {
      threadId: string;
      messages: Message[];
      abortController: AbortController;
    }) =>
      fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: finalSystemPrompt,
          messages: openAIMessageFormat.toApi(messages),
        }),
        signal: abortController.signal,
      });
  }, [processMessage, apiUrl, finalSystemPrompt]);

  return (
    <div className={className ?? "openui-plotly-chat"} style={{ width: "100%", height: "100%" }}>
      <FullScreen
        processMessage={finalProcessMessage}
        streamProtocol={openAIReadableStreamAdapter()}
        componentLibrary={plotlyLibrary}
        agentName={agentName}
        assistantMessage={({ message, isStreaming }) => (
          <PlotlyAssistantMessage
            message={message}
            isStreaming={isStreaming}
            library={plotlyLibrary}
          />
        )}
      />
    </div>
  );
}
