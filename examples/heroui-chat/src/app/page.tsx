"use client";
import "@openuidev/react-ui/components.css";

import { herouiChatLibrary } from "@/lib/heroui-genui";
import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";

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
        componentLibrary={herouiChatLibrary}
        agentName="OpenUI Chat"
        theme={{ mode: "light" }}
        conversationStarters={{
          variant: "short",
          options: [
            {
              displayText: "Weather in Tokyo",
              prompt: "What's the weather like in Tokyo right now?",
            },
            { displayText: "AAPL stock price", prompt: "What's the current Apple stock price?" },
            {
              displayText: "Contact form",
              prompt: "Build me a contact form with name, email, topic, and message fields.",
            },
            {
              displayText: "Data table",
              prompt:
                "Show me a table of the top 5 programming languages by popularity with year created.",
            },
          ],
        }}
      />
    </div>
  );
}
