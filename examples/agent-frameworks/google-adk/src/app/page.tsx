"use client";

import { localStorageChat } from "@/lib/local-storage";
import { library, ThemeProvider } from "@openuidev/intelligent-ui-library";
import { AgentInterface, agUIAdapter, fetchLLM, useSystemThemeMode } from "@openuidev/react-ui";

const { llm, storage } = localStorageChat(
  fetchLLM({
    url: "/api/chat",
    streamAdapter: agUIAdapter(),
  }),
  "openui-google-adk",
);

export default function Page() {
  const mode = useSystemThemeMode();
  return (
    <div className="app-shell">
      <ThemeProvider mode={mode}>
        <AgentInterface
          llm={llm}
          storage={storage}
          componentLibrary={library}
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
      </ThemeProvider>
    </div>
  );
}
