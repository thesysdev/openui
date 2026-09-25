"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import { AgentInterface, useSystemThemeMode } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { createEveLLM } from "../eve-chat";

const llm = createEveLLM();

export default function Home() {
  const mode = useSystemThemeMode();

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      <AgentInterface
        llm={llm}
        componentLibrary={openuiLibrary}
        agentName="OpenUI Self Hosted"
        theme={{ mode }}
      />
    </div>
  );
}
