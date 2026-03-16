"use client";
import "@openuidev/react-ui/components.css";

import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";

export default function Page() {
  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <FullScreen
        processMessage={async ({ messages, abortController }) => {
          return fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: openAIMessageFormat.toApi(messages),
            }),
            signal: abortController.signal,
          });
        }}
        streamProtocol={openAIAdapter()}
        componentLibrary={openuiChatLibrary}
        agentName="Analytics Demo"
        theme={{ mode: "light" }}
        conversationStarters={{
          variant: "short",
          options: [
            {
              displayText: "Revenue trends",
              prompt: "Show me monthly revenue trends for the past year.",
            },
            {
              displayText: "Q1 vs Q2 sales",
              prompt: "Compare Q1 vs Q2 sales by product category.",
            },
            {
              displayText: "Key metrics",
              prompt: "What are our key business metrics right now?",
            },
            {
              displayText: "Customer segments",
              prompt: "Break down our customer base by segment and show spending patterns.",
            },
          ],
        }}
      />
    </div>
  );
}
