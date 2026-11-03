"use client";

import { localStorageChat } from "@/lib/local-storage";
import { ThemeProvider } from "@openuidev/react-components";
import {
  AgentInterface,
  openAIAdapter,
  openAIMessageFormat,
  useSystemThemeMode,
} from "@openuidev/react-ui";
import { DashboardMessage } from "./DashboardMessage";

const { llm, storage } = localStorageChat(
  {
    send: ({ messages, signal }) =>
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: openAIMessageFormat.toApi(messages) }),
        signal,
      }),
    streamProtocol: openAIAdapter(),
  },
  "openui-dashboard-library",
);

export default function Page() {
  const mode = useSystemThemeMode();

  // The dashboard kit reads light or dark mode from the react-components ThemeProvider.
  // Replies render through DashboardMessage, which puts the dashboard in the side panel.
  return (
    <ThemeProvider mode={mode}>
      <div className="h-screen">
        <AgentInterface
          llm={llm}
          storage={storage}
          components={{ AssistantMessage: DashboardMessage }}
          agentName="Dashboard Library"
          theme={{ mode }}
          starterVariant="short"
          starters={[
            {
              displayText: "Sales overview",
              prompt:
                "Build a sales overview dashboard with region and period filters: revenue, orders and churn KPIs, the revenue trend, revenue by category, and recent orders.",
            },
            {
              displayText: "E-commerce orders",
              prompt:
                "Show an e-commerce orders dashboard for last quarter: orders and AOV KPIs, orders by week, sales by category, and recent orders in a table.",
            },
            {
              displayText: "Order management",
              prompt:
                "Show recent orders in a table with a status filter, where I can mark pending orders as shipped.",
            },
            {
              displayText: "Regional comparison",
              prompt:
                "Compare revenue across North America, EMEA and APAC over the last 12 months.",
            },
          ]}
        />
      </div>
    </ThemeProvider>
  );
}
