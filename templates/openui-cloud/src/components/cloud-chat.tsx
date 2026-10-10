"use client";

import { usePersistedModel } from "@/hooks/use-persisted-model";
import { MODEL_OPTIONS } from "@/lib/models";
import { OPENUI_LOGOS, PROMPT_TEMPLATES, STARTERS } from "@/lib/starters";
import {
  AgentInterface,
  ModelSwitcher,
  fetchLLM,
  langGraphAdapter,
  langGraphMessageFormat,
  openuiLibrary,
  useOpenuiCloudStorage,
  useSystemThemeMode,
} from "@openuidev/react-ui";

export default function CloudChat() {
  const mode = useSystemThemeMode();
  const [selectedModel, setSelectedModel] = usePersistedModel();
  // The /api/chat route runs the LangGraph agent in-process and streams its
  // native `messages`-mode SSE. Outgoing messages are converted to LangChain
  // shape here so the route can pass them to the graph as-is.
  const llm = fetchLLM({
    url: "/api/chat",
    streamAdapter: langGraphAdapter(),
    messageFormat: langGraphMessageFormat,
    body: { model: selectedModel },
  });

  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    apiBaseUrl: "https://api.thesys.dev",
    features: { artifact: false }
  });

  const logoPath = mode === "dark" ? OPENUI_LOGOS.DARK : OPENUI_LOGOS.LIGHT;

  return (
    <div className="openui-cloud-page">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={openuiLibrary}
        logoUrl={logoPath}
        theme={{ mode }}
        starters={STARTERS}
      >
        <AgentInterface.MobileHeader
          agentName=""
          actions={
            <ModelSwitcher
              models={MODEL_OPTIONS}
              value={selectedModel}
              onValueChange={setSelectedModel}
            />
          }
        />
        <AgentInterface.ThreadHeader className="openui-cloud-thread-header">
          <ModelSwitcher
            models={MODEL_OPTIONS}
            value={selectedModel}
            onValueChange={setSelectedModel}
          />
        </AgentInterface.ThreadHeader>
        <AgentInterface.Welcome
          title="Good to see you"
          description="What's on your mind today?"
          promptTemplates={PROMPT_TEMPLATES}
          glowAnimation
        />
      </AgentInterface>
    </div>
  );
}
