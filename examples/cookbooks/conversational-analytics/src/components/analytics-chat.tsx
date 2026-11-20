"use client";

import { ThemeProvider } from "@openuidev/intelligent-ui-library";
import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
  useOpenuiCloudStorage,
  useSystemThemeMode,
} from "@openuidev/react-ui";
import { library } from "../library";

// Send the thread's messages in Chat Completions format and read the runner's stream from the route.
const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: openAIReadableStreamAdapter(),
  messageFormat: openAIMessageFormat,
});

const starters = [
  {
    displayText: "Which five drivers set the fastest laps in Miami?",
    prompt:
      "Rank the five drivers with the fastest recorded laps in the 2024 Miami Grand Prix. Show the driver, lap number, and lap time in a table.",
  },
  {
    displayText: "Compare Norris and Verstappen lap by lap",
    prompt:
      "Compare Lando Norris and Max Verstappen's lap times across the 2024 Miami Grand Prix in a line chart.",
  },
  {
    displayText: "Who was faster over the final ten laps?",
    prompt:
      "Compare Lando Norris and Max Verstappen on each of the final ten laps of the 2024 Miami Grand Prix. Show their lap times in a line chart.",
  },
];

export default function AnalyticsChat() {
  const mode = useSystemThemeMode();
  // Store threads as Gateway conversations, which the browser reaches with a short-lived token
  // from /api/frontend-token. The chat route appends each turn to the thread's conversation, so
  // a thread opened again loads its messages.
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    features: { artifact: false },
  });
  return (
    <div className="analytics-app">
      <ThemeProvider mode={mode}>
        <AgentInterface
          llm={llm}
          storage={storage}
          componentLibrary={library}
          agentName="Data analyst"
          theme={{ mode }}
          starters={starters}
        >
          <AgentInterface.MobileHeader agentName="Data analyst" />
          <AgentInterface.Welcome
            title="Explore your data through conversation"
            description="Ask about recorded lap times from the 2024 Miami Grand Prix, provided by OpenF1. Follow up to explore a different angle."
          />
          <AgentInterface.Composer placeholder="Ask a question about your data…" />
        </AgentInterface>
      </ThemeProvider>
    </div>
  );
}
