"use client";
import "@openuidev/react-ui/components.css";

import { shadcnChatLibrary } from "@/lib/shadcn-genui";
import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { useState } from "react";

export default function Page() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  return (
    <div className={`h-screen w-screen overflow-hidden relative ${mode === "dark" ? "dark" : ""}`}>
      <nav
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 50,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setMode((m) => (m === "light" ? "dark" : "light"))}
          className="text-sm px-3 py-1.5 rounded-md border border-border bg-background text-foreground hover:bg-accent transition-colors backdrop-blur-sm"
        >
          {mode === "light" ? "Switch to Dark" : "Switch to Light"}
        </button>
      </nav>
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
        componentLibrary={shadcnChatLibrary}
        agentName="shadcn/ui Chat"
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
