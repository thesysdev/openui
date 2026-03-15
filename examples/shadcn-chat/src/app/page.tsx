"use client";
import "@openuidev/react-ui/components.css";

import { useTheme } from "@/hooks/use-system-theme";
import { shadcnChatLibrary } from "@/lib/shadcn-genui";
import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";

export default function Page() {
  const mode = useTheme();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <FullScreen
        processMessage={async ({ messages, abortController }) => {
          return fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: openAIMessageFormat.toApi(messages),
            }),
            signal: abortController.signal,
          });
        }}
        streamProtocol={openAIAdapter()}
        componentLibrary={shadcnChatLibrary}
        agentName="shadcn/ui Chat"
        theme={{ mode }}
        conversationStarters={{
          variant: "short",
          options: [
            {
              displayText: "Startup dashboard",
              prompt:
                "Build a startup analytics dashboard with tags, Tabs (Revenue BarChart, Growth LineChart, Breakdown PieChart), a key metrics table, a progress bar toward the annual goal, and follow-ups.",
            },
            {
              displayText: "Travel planner",
              prompt:
                "Design a trip planner with a range CalendarBlock (2 months), an Accordion for 3 destinations (Tokyo, Paris, New York) each with description, tags, and a budget progress bar, then a preferences form with select, slider, and checkboxes. Add follow-ups.",
            },
            {
              displayText: "Market watch",
              prompt:
                "Fetch stock prices for AAPL, NVDA, GOOGL, and TSLA. Show a market overview with tags, a comparison table, an alert for the biggest mover, and a DrawerBlock with a BarChart comparing all four. Add follow-ups.",
            },
            {
              displayText: "Event RSVP",
              prompt:
                "Create an event RSVP form for a tech summit with an info alert, and a form containing inputs for name and email, a select for ticket tier, radio group for diet, date picker, slider for group size, checkboxes for sessions, and switches for notifications. Add follow-ups.",
            },
            {
              displayText: "Team standup",
              prompt:
                "Generate a team standup board with a sprint progress bar, a task table (5 members), a warning alert for blockers, an Accordion (Yesterday, Today, Blockers), and a DialogBlock that opens sprint metrics with a PieChart and summary table. Add follow-ups.",
            },
            {
              displayText: "Recipe card",
              prompt:
                "Build a recipe card for Spicy Thai Basil Chicken with tags, Tabs (Ingredients table, Instructions accordion with 5 steps, Nutrition donut PieChart + table), a blockquote chef's tip, and buttons with a DialogBlock for the full recipe. Add follow-ups.",
            },
            {
              displayText: "Chart showcase",
              prompt:
                "Build a 'Global Tech Industry Report 2025' with tags and Tabs containing six chart types: a grouped BarChart (quarterly revenue, 3 series), a LineChart (monthly trends, 2 series), an AreaChart (yearly adoption, 2 series), a donut PieChart (market share, 6 slices), a RadarChart (developer skills, 2 series), and a ScatterChart (funding vs revenue, 2 series with labeled points). Below add a summary table, a RadialChart for industry goals, and follow-ups.",
            },
          ],
        }}
      />
    </div>
  );
}
