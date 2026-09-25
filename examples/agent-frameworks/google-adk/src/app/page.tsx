"use client";

import { AgentInterface, agUIAdapter, fetchLLM, useSystemThemeMode } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

export default function Page() {
  const mode = useSystemThemeMode();
  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: agUIAdapter(),
      }),
    [],
  );

  return (
    <div className="app-shell">
      <AgentInterface
        llm={llm}
        componentLibrary={openuiLibrary}
        agentName="OpenUI + Google ADK Chat"
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "Weather in Tokyo",
            prompt: "What's the weather like in Tokyo right now?",
          },
          {
            displayText: "Compare cities",
            prompt: "Compare the current weather in Tokyo, London, and San Francisco.",
          },
          {
            displayText: "Contact form",
            prompt: "Build me a contact form with name, email, topic, and message fields.",
          },
          {
            displayText: "Data table",
            prompt:
              "Show me a table of the top 5 programming languages by popularity with year created.",
          },
        ]}
      />
    </div>
  );
}
