"use client";

import {
  AgentInterface,
  fetchLLM,
  openAIAdapter,
  openAIMessageFormat,
  useOpenuiCloudStorage,
  useSystemThemeMode,
} from "@openuidev/react-ui";
import { Briefcase, CalendarDays, Users, Wallet } from "lucide-react";
import { useMemo } from "react";
import { darkTheme, lightTheme } from "../lib/theme";
import { library } from "../library";

// Send the thread's messages in Chat Completions format and read the route's completion chunks.
const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: openAIAdapter(),
  messageFormat: openAIMessageFormat,
});

const starters = [
  {
    displayText: "A room in Goa for two this weekend",
    prompt: "Book a room in Goa for two this weekend.",
    icon: <CalendarDays size={16} />,
  },
  {
    displayText: "A family trip to Barcelona",
    prompt:
      "We're two adults and two kids, ages 6 and 9, looking for a hotel in Barcelona with a pool for five nights in late October.",
    icon: <Users size={16} />,
  },
  {
    displayText: "A cheap stay near Shibuya",
    prompt:
      "A cheap hotel near Shibuya Station in Tokyo for one, next month, with free cancellation.",
    icon: <Wallet size={16} />,
  },
  {
    displayText: "A work trip to New York",
    prompt: "A 4-star hotel in Midtown Manhattan with a gym for a work trip, November 10 to 13.",
    icon: <Briefcase size={16} />,
  },
];

export default function BookingChat() {
  const mode = useSystemThemeMode();
  const theme = useMemo(() => ({ mode, lightTheme, darkTheme }), [mode]);
  // Store threads as Gateway conversations, which the browser reaches with a short-lived token
  // from /api/frontend-token. The chat route appends each turn to the thread's conversation, so
  // a thread opened again loads its messages.
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    features: { artifact: false },
  });
  return (
    <div className="booking-app">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={library}
        agentName="Stay finder"
        logoUrl="/logo.svg"
        theme={theme}
        starters={starters}
        starterVariant="long"
      >
        <AgentInterface.ThreadHeader>
          <span className="thread-context">
            Live hotel prices from{" "}
            <a href="https://mcp.trivago.com/docs" target="_blank" rel="noreferrer">
              trivago
            </a>{" "}
            · You book on the hotel or booking site
          </span>
        </AgentInterface.ThreadHeader>
        <AgentInterface.Welcome
          image={{ url: "/logo.svg" }}
          title="Where are you headed?"
          description="Describe your trip in your own words. I'll turn it into a form with what I understood, ask only for what's missing, and find stays with live prices."
        />
        <AgentInterface.Composer placeholder="Describe your trip…" />
      </AgentInterface>
    </div>
  );
}
