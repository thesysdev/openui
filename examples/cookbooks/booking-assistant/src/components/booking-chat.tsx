"use client";

import {
  AgentInterface,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  useOpenuiCloudStorage,
  useSystemThemeMode,
  type ChatLLM,
} from "@openuidev/react-ui";
import { CalendarCheck, CalendarDays, PartyPopper, Users, Wallet } from "lucide-react";
import { useMemo } from "react";
import { darkTheme, lightTheme } from "../lib/theme";
import { library } from "../library";
import { MyBookings } from "./my-bookings";

// Gateway restores earlier turns from the conversation id, so send only the latest message.
const chatLLM: ChatLLM = {
  streamProtocol: openAIResponsesAdapter(),
  send: ({ threadId, messages, signal }) =>
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId,
        input: openAIConversationMessageFormat.toApi(messages.slice(-1)),
      }),
      signal,
    }),
};

const starters = [
  {
    displayText: "A place for two this weekend",
    prompt: "Book a place in Lisbon for two this weekend.",
    icon: <CalendarDays size={16} />,
  },
  {
    displayText: "A family week in Belém with a kitchen",
    prompt:
      "We're a family of four looking for an entire place in Belém for a week in late October, with a kitchen and a washer.",
    icon: <Users size={16} />,
  },
  {
    displayText: "A cheap room for a solo trip",
    prompt:
      "Find me a cheap private room for a solo trip next month, under €70 a night, with wifi.",
    icon: <Wallet size={16} />,
  },
  {
    displayText: "New Year's Eve in Alfama",
    prompt:
      "An apartment in Alfama for three friends over New Year's Eve, December 30 to January 2, with air conditioning.",
    icon: <PartyPopper size={16} />,
  },
];

export default function BookingChat() {
  const mode = useSystemThemeMode();
  const theme = useMemo(() => ({ mode, lightTheme, darkTheme }), [mode]);
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    features: { artifact: false },
  });
  return (
    <div className="booking-app">
      <AgentInterface
        llm={chatLLM}
        storage={storage}
        componentLibrary={library}
        agentName="Lisbon stays"
        logoUrl="/logo.svg"
        theme={theme}
        starters={starters}
        starterVariant="long"
      >
        <AgentInterface.Sidebar>
          <AgentInterface.SidebarHeader />
          <AgentInterface.SidebarContent>
            <AgentInterface.NewChatButton />
            <AgentInterface.SidebarItem path="bookings" icon={<CalendarCheck size={16} />}>
              My bookings
            </AgentInterface.SidebarItem>
            <AgentInterface.SidebarSeparator />
            <AgentInterface.ThreadList />
          </AgentInterface.SidebarContent>
        </AgentInterface.Sidebar>
        <AgentInterface.Route path="bookings">
          <MyBookings />
        </AgentInterface.Route>
        <AgentInterface.ThreadHeader>
          <span className="thread-context">
            Real listings from{" "}
            <a href="https://insideairbnb.com/get-the-data/" target="_blank" rel="noreferrer">
              Inside Airbnb
            </a>{" "}
            · Bookings are simulated
          </span>
        </AgentInterface.ThreadHeader>
        <AgentInterface.Welcome
          image={{ url: "/logo.svg" }}
          title="Where are you staying in Lisbon?"
          description="Describe your trip in your own words. I'll turn it into a form with what I understood, ask only for what's missing, and check real availability."
        />
        <AgentInterface.Composer placeholder="Describe your trip…" />
      </AgentInterface>
    </div>
  );
}
