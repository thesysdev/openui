"use client";

import {
  AgentInterface,
  agUIAdapter,
  fetchLLM,
  openAIMessageFormat,
  useOpenuiCloudStorage,
  type ThemeProps,
} from "@openuidev/react-ui";
import { library } from "../library";

// Send the thread's messages in Chat Completions format and read the route's AG-UI events.
const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: agUIAdapter(),
  messageFormat: openAIMessageFormat,
});

const theme: ThemeProps = { mode: "light" };
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
  // Store threads as Gateway conversations, which the browser reaches with a short-lived token
  // from /api/frontend-token. Chat Completions doesn't write to them, so Gateway keeps each
  // thread's title but not its messages.
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    features: { artifact: false },
  });
  return (
    <div className="analytics-app">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={library}
        agentName="Data analyst"
        theme={theme}
        starters={starters}
      >
        <AgentInterface.MobileHeader agentName="Data analyst" />
        <AgentInterface.Welcome
          title="Explore your data through conversation"
          description="Ask about recorded lap times from the 2024 Miami Grand Prix, provided by OpenF1. Follow up to explore a different angle."
        />
        <AgentInterface.Composer placeholder="Ask a question about your data…" />
      </AgentInterface>
    </div>
  );
}
