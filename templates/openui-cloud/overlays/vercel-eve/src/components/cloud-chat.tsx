"use client";

import { OPENUI_LOGOS, STARTERS } from "@/lib/starters";
import { AgentInterface, useSystemThemeMode } from "@openuidev/react-ui";
import { chatLibrary, useOpenuiCloudStorage } from "@openuidev/thesys";
import { useMemo } from "react";
import { createEveLLM } from "../eve-chat";

export default function CloudChat() {
  const mode = useSystemThemeMode();
  const llm = useMemo(() => createEveLLM(), []);

  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    apiBaseUrl: "https://api.thesys.dev",
  });

  const logoPath = mode === "dark" ? OPENUI_LOGOS.DARK : OPENUI_LOGOS.LIGHT;

  return (
    <div className="openui-cloud-page">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={chatLibrary}
        logoUrl={logoPath}
        theme={{ mode }}
        starters={STARTERS}
      >
        <AgentInterface.Welcome
          title="Good to see you"
          description="What's on your mind today?"
          glowAnimation
        />
      </AgentInterface>
    </div>
  );
}
