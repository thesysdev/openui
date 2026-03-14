"use client";
import "@openuidev/react-ui/components.css";

import { useSystemTheme } from "@/hooks/use-system-theme";
import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useEffect } from "react";

export default function Page() {
  const mode = useSystemTheme();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

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
        agentName="OpenUI Chat"
        theme={{ mode }}
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
