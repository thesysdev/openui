"use client";

import { localStorageChat } from "@/lib/local-storage";
import { AgentInterface, agUIAdapter, fetchLLM, useSystemThemeMode } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

const { llm, storage } = localStorageChat(
  fetchLLM({
    url: "/api/chat",
    streamAdapter: agUIAdapter(),
  }),
  "openui-langgraph",
);

export default function Page() {
  const mode = useSystemThemeMode();

  return (
    <div className="app-shell">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={openuiLibrary}
        agentName="OpenUI + DeepAgents Chat"
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "Weather in Tokyo",
            prompt: "What's the weather like in Tokyo right now?",
          },
          { displayText: "AAPL stock price", prompt: "What's the current Apple stock price?" },
          {
            displayText: "Research a topic",
            prompt: "Give me a quick briefing on the James Webb Space Telescope.",
          },
          {
            displayText: "Compare cities",
            prompt: "Compare the weather in London and Sydney right now.",
          },
        ]}
      />
    </div>
  );
}
