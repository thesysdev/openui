"use client";

import "@openuidev/react-ui/styles/index.css";

import { localStorageChat } from "@/lib/local-storage";
import { library, ThemeProvider } from "@openuidev/intelligent-ui-library";
import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
  useSystemThemeMode,
} from "@openuidev/react-ui";

const { llm, storage } = localStorageChat(
  fetchLLM({
    url: "/api/chat",
    streamAdapter: openAIReadableStreamAdapter(),
    messageFormat: openAIMessageFormat,
  }),
  "openui-pi",
);

export default function Home() {
  const mode = useSystemThemeMode();
  // Browser thread metadata and messages persist in local storage.
  // fetchLLM POSTs { threadId, messages }; the route keys a persistent pi
  // AgentSession on that threadId. The Cloud system prompt is attached server-side.
  return (
    <div className="h-screen w-screen overflow-hidden">
      <ThemeProvider mode={mode}>
        <AgentInterface
          llm={llm}
          storage={storage}
          componentLibrary={library}
          agentName="OpenUI Agent Harness"
          theme={{ mode }}
          starterVariant="short"
          starters={[
            {
              displayText: "Launch checklist",
              prompt: "Create a launch checklist for a new AI feature.",
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
