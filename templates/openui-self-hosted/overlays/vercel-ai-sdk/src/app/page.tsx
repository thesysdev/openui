"use client";
import "@openuidev/react-ui/styles/index.css";

import { OpenUIWordmark } from "@/components/openui-wordmark";
import { OPENUI_LOGO, STARTERS } from "@/lib/starters";
import { library, ThemeProvider } from "@openuidev/intelligent-ui-library";
import {
  AgentInterface,
  fetchLLM,
  useThemeModePreference,
  vercelAIAdapter,
  vercelAIMessageFormat,
  WelcomeMascot,
} from "@openuidev/react-ui";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: vercelAIAdapter(),
  messageFormat: vercelAIMessageFormat,
});

export default function Home() {
  // Follows the system theme until the footer toggle is first used, then
  // remembers the choice.
  const { setPreference, mode } = useThemeModePreference();

  return (
    <ThemeProvider mode={mode}>
      <AgentInterface
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
