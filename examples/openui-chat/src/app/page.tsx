"use client";
import "@openuidev/react-ui/components.css";

import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useState } from "react";

export default function Page() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  return (
    <div className="h-screen w-screen overflow-hidden relative">
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
          style={{
            fontSize: 13,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid rgba(128,128,128,0.3)",
            background: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            color: mode === "dark" ? "#fff" : "#333",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
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
        componentLibrary={openuiChatLibrary}
        agentName="OpenUI Chat"
        theme={{ mode }}
        conversationStarters={{
          variant: "short",
          options: [
            { displayText: "Weather in Tokyo", prompt: "What's the weather like in Tokyo right now?" },
            { displayText: "AAPL stock price", prompt: "What's the current Apple stock price?" },
            { displayText: "Contact form", prompt: "Build me a contact form with name, email, topic, and message fields." },
            { displayText: "Data table", prompt: "Show me a table of the top 5 programming languages by popularity with year created." },
          ],
        }}
      />
    </div>
  );
}
