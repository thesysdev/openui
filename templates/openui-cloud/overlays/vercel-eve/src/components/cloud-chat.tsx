"use client";

import { OpenUIWordmark } from "@/components/openui-wordmark";
import { OPENUI_LOGO, STARTERS } from "@/lib/starters";
import { library, ThemeProvider } from "@openuidev/intelligent-ui-library";
import {
  AgentInterface,
  useOpenuiCloudStorage,
  useThemeModePreference,
  WelcomeMascot,
} from "@openuidev/react-ui";
import { useMemo } from "react";
import { createEveLLM } from "../eve-chat";

export default function CloudChat() {
  // Follows the system theme until the footer toggle is first used, then
  // remembers the choice.
  const { setPreference, mode } = useThemeModePreference();
  const llm = useMemo(() => createEveLLM(), []);

  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    apiBaseUrl: "https://api.thesys.dev",
    features: { artifact: false },
  });

  // Eve fixes its model when the agent is built, so unlike the base template
  // there's no model switcher; the header shows the chat title instead.
  return (
    <ThemeProvider mode={mode}>
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={library}
        logoUrl={OPENUI_LOGO}
        theme={{ mode }}
        starters={STARTERS}
      >
        <AgentInterface.SidebarHeader agentName={<OpenUIWordmark mode={mode} />} />
        <AgentInterface.SidebarFooter>
          <AgentInterface.ThemeModeToggle mode={mode} onModeChange={setPreference} />
        </AgentInterface.SidebarFooter>
        <AgentInterface.ThreadHeader />
        <AgentInterface.Welcome
          image={<WelcomeMascot />}
          title="What's on your mind today?"
          starterVariant="card"
          glowAnimation
        />
      </AgentInterface>
    </ThemeProvider>
  );
}
