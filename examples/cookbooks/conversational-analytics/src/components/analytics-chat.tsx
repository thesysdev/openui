"use client";

import {
  AgentInterface,
  agUIAdapter,
  fetchLLM,
  openAIMessageFormat,
  type ThemeProps,
} from "@openuidev/react-ui";
import { f1Theme } from "../f1-typography";
import { library } from "../library";

// Send the thread's messages in Chat Completions format and read the route's AG-UI events.
const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: agUIAdapter(),
  messageFormat: openAIMessageFormat,
});

const theme: ThemeProps = { mode: "light", lightTheme: f1Theme };
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
  return (
    <div className="analytics-app">
      <AgentInterface
        llm={llm}
        componentLibrary={library}
        agentName="OpenUI x F1"
        theme={theme}
        starters={starters}
      >
        <AgentInterface.MobileHeader agentName="OpenUI x F1" />
        <AgentInterface.Welcome
          title="OpenUI x F1"
          description="Ask about recorded lap times from the 2024 Miami Grand Prix, provided by OpenF1. Follow up to explore a different angle."
        />
        <AgentInterface.Composer placeholder="Ask a question about your data…" />
      </AgentInterface>
    </div>
  );
}
