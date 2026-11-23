"use client";

import { library, ThemeProvider } from "@openuidev/intelligent-ui-library";
import { AgentInterface, useSystemThemeMode } from "@openuidev/react-ui";
import { useMemo } from "react";
import { createEveChatProps } from "../eve-chat";

export default function Page() {
  const mode = useSystemThemeMode();
  const { llm, storage } = useMemo(() => createEveChatProps(), []);

  return (
    <div className="app-shell">
      <ThemeProvider mode={mode}>
        <AgentInterface
          llm={llm}
          storage={storage}
          componentLibrary={library}
          agentName="Eve + OpenUI"
          theme={{ mode }}
          starterVariant="short"
          starters={[
            {
              displayText: "Berlin weather",
              prompt: "What's the weather in Berlin?",
            },
            {
              displayText: "Launch checklist",
              prompt: "Create a launch checklist for a new AI feature.",
            },
            {
              displayText: "Project status",
              prompt: "Turn this into a project status brief with risks and next steps.",
            },
            {
              displayText: "Onboarding flow",
              prompt: "Design a customer onboarding flow for a B2B SaaS product.",
            },
            {
              displayText: "Support case",
              prompt: "Summarize a support case as an action dashboard.",
            },
          ]}
        />
      </ThemeProvider>
    </div>
  );
}
