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
  "openui-dashboard-kit-testbench",
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
          agentName="Dashboard Kit Test Bench"
          theme={{ mode }}
          starterVariant="short"
          starters={[
            {
              displayText: "SaaS revenue",
              prompt:
                "Build a SaaS revenue dashboard: MRR, churn and new customers as KPIs, MRR by month, revenue by plan, and the top 5 accounts. Add a region filter.",
            },
            {
              displayText: "E-commerce orders",
              prompt:
                "Show an e-commerce orders dashboard for last quarter with a date filter: orders and AOV KPIs, orders by week, sales by category, and recent orders in a table.",
            },
            {
              displayText: "Support tickets",
              prompt:
                "Make a support ticket dashboard: open tickets, median first response and CSAT, tickets by priority, and a list of the oldest open tickets.",
            },
            {
              displayText: "Website traffic",
              prompt:
                "Build a website analytics dashboard with sessions, bounce rate and conversion rate, traffic by source, and sessions by day with a device filter.",
            },
          ]}
        />
      </div>
    </ThemeProvider>
  );
}
