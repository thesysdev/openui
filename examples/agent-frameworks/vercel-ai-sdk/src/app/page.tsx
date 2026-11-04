"use client";

import { localStorageChat } from "@/lib/local-storage";
import {
  AgentInterface,
  fetchLLM,
  useSystemThemeMode,
  vercelAIAdapter,
  vercelAIMessageFormat,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

const { llm, storage } = localStorageChat(
  fetchLLM({
    url: "/api/chat",
    streamAdapter: vercelAIAdapter(),
    messageFormat: vercelAIMessageFormat,
  }),
  "openui-vercel-ai-sdk",
);

export default function Page() {
  const mode = useSystemThemeMode();

  // The route returns the AI SDK's native UIMessage stream, so the browser
  // decodes it with the SDK's own adapter and message format.
  return (
    <div className="app-shell">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={openuiLibrary}
        agentName="OpenUI + Vercel AI SDK"
        theme={{ mode }}
        starterVariant="short"
        starters={[
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
        ]}
      />
    </div>
  );
}
