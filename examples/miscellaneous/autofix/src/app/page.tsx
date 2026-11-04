"use client";

import { localStorageChat } from "@/lib/local-storage";
import { starters } from "@/lib/starters";
import { library } from "@/library";
import {
  AgentInterface,
  fetchLLM,
  openAIAdapter,
  openAIMessageFormat,
  useSystemThemeMode,
} from "@openuidev/react-ui";

const { llm, storage } = localStorageChat(
  fetchLLM({
    url: "/api/chat",
    streamAdapter: openAIAdapter(),
    messageFormat: openAIMessageFormat,
  }),
  "openui-autofix",
);

export default function Page() {
  const mode = useSystemThemeMode();
  return (
    <main className="autofix-app">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={library}
        agentName="OpenUI Autofix"
        theme={{ mode }}
        starters={starters}
        starterVariant="short"
      >
        <AgentInterface.Welcome
          title="Good to see you!"
          description="OpenAI generates your interface. OpenUI Autofix validates it and fixes it for you."
        />
        <AgentInterface.Composer placeholder="Ask for a summary, dashboard, or status card…" />
      </AgentInterface>
    </main>
  );
}
