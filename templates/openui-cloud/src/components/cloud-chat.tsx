"use client";

import { usePersistedModel } from "@/hooks/use-persisted-model";
import { MODEL_OPTIONS } from "@/lib/models";
import { OPENUI_LOGOS, PROMPT_TEMPLATES, STARTERS } from "@/lib/starters";
import {
  AgentInterface,
  ModelSwitcher,
  fetchLLM,
  openuiLibrary,
  openAIMessageFormat,
  openAIAdapter,
  useOpenuiCloudStorage,
  useSystemThemeMode,
} from "@openuidev/react-ui";

export default function CloudChat() {
  const mode = useSystemThemeMode();
  const [selectedModel, setSelectedModel] = usePersistedModel();
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    apiBaseUrl: "https://api.thesys.dev",
    features: { artifact: false },
  });

  const transport = fetchLLM({
    url: "/api/chat",
    streamAdapter: openAIAdapter(),
    messageFormat: openAIMessageFormat,
    body: { model: selectedModel },
  });

  const llm = {
    ...transport,
    send: async (params: Parameters<typeof transport.send>[0]) => {
      // Completion chunks have no tool-result events. Replay persisted history
      // so earlier tool calls always include the results saved by our server.
      const history = await storage.thread.getMessages(params.threadId);
      params.signal.throwIfAborted();
      return transport.send({
        ...params,
        messages: [...history, ...params.messages.slice(-1)],
      });
    },
  };

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
