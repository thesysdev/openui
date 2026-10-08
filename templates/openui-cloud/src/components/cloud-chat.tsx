"use client";

import { BrandLogo, BrandWordmark } from "@/components/brand-logo";
import { WelcomeMascot } from "@/components/welcome-mascot";
import { usePersistedModel } from "@/hooks/use-persisted-model";
import { MODEL_OPTIONS } from "@/lib/models";
import { OPENUI_LOGOS, PROMPT_TEMPLATES, STARTERS } from "@/lib/starters";
import {
  AgentInterface,
  ModelSwitcher,
  fetchLLM,
  openuiLibrary,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  useOpenuiCloudStorage,
  useSystemThemeMode,
} from "@openuidev/react-ui";

export default function CloudChat() {
  const mode = useSystemThemeMode();
  const [selectedModel, setSelectedModel] = usePersistedModel();
  const llm = fetchLLM({
    url: "/api/chat",
    streamAdapter: openAIResponsesAdapter(),
    messageFormat: openAIConversationMessageFormat,
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
        <AgentInterface.SidebarHeader
          logo={<BrandLogo />}
          agentName={<BrandWordmark mode={mode} />}
        />
        <AgentInterface.MobileHeader
          agentName=""
          logo={
            <ModelSwitcher
              models={MODEL_OPTIONS}
              value={selectedModel}
              onValueChange={setSelectedModel}
            />
          }
        />
        <AgentInterface.ChatHeader
          showChatTitle={false}
          start={
            <ModelSwitcher
              models={MODEL_OPTIONS}
              value={selectedModel}
              onValueChange={setSelectedModel}
            />
          }
        />
        <AgentInterface.Welcome
          image={<WelcomeMascot className="brand-welcome-mark" />}
          title="What's on your mind today?"
          promptTemplates={PROMPT_TEMPLATES}
          starterVariant="card"
          glowAnimation
        />
      </AgentInterface>
    </div>
  );
}
