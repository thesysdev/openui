"use client";

import {
  AgentInterface,
  useNav,
  useThread,
  useThreadList,
  type AgentInterfaceComponents,
  type ThemeProps,
} from "@openuidev/react-ui";
import { useEffect, useMemo, useState } from "react";
import { createChatSession, exampleThreadId, type ChatSession } from "../lib/chat-session";
import { library } from "../library";
import { DashboardMessage } from "./dashboard-message";

const theme: ThemeProps = { mode: "light" };
const starters = [
  { displayText: "Explain February's sales", prompt: "Why did gross sales fall in February 2011?" },
  { displayText: "Explore Germany", prompt: "Show Germany in February 2011 as a bar chart." },
  { displayText: "Compare November", prompt: "Compare November 2011 gross sales with October." },
];

function SessionSync({ session }: { session: ChatSession }) {
  const messages = useThread((state) => state.messages);
  const loading = useThread((state) => state.isLoadingMessages);
  const threadId = useThreadList((state) => state.selectedThreadId);
  useEffect(() => {
    if (threadId && !loading) session.saveMessages(threadId, messages);
  }, [threadId, messages, loading, session]);
  return null;
}

function ExampleButton({ session }: { session: ChatSession }) {
  const selectThread = useThreadList((state) => state.selectThread);
  const loadThreads = useThreadList((state) => state.loadThreads);
  const { navigate } = useNav();
  return (
    <button
      className="example-button"
      type="button"
      onClick={() => {
        session.ensureExample();
        loadThreads();
        navigate(undefined);
        selectThread(exampleThreadId);
      }}
    >
      Example dashboard
    </button>
  );
}

export default function RetailChat() {
  const [session] = useState(createChatSession);
  const components = useMemo<AgentInterfaceComponents>(
    () => ({
      AssistantMessage: (props) => <DashboardMessage {...props} session={session} />,
    }),
    [session],
  );
  return (
    <div className="retail-app">
      <AgentInterface
        llm={session.llm}
        storage={session.storage}
        componentLibrary={library}
        components={components}
        agentName="Retail analyst"
        theme={theme}
        starters={starters}
      >
        <AgentInterface.MobileHeader
          agentName="Retail analyst"
          actions={<ExampleButton session={session} />}
        />
        <AgentInterface.ThreadHeader>
          <div className="retail-toolbar">
            <a
              href="https://www.openui.com/docs/cookbooks/conversational-analytics"
              target="_blank"
              rel="noreferrer"
            >
              Cookbook ↗
            </a>
            <a
              href="https://archive.ics.uci.edu/dataset/352/online+retail"
              target="_blank"
              rel="noreferrer"
            >
              Dataset ↗
            </a>
            <ExampleButton session={session} />
          </div>
        </AgentInterface.ThreadHeader>
        <AgentInterface.Welcome
          title="Explore retail sales"
          description="Ask about real UCI retail transactions from January to November 2011. Open the example dashboard to try the filters without a Cloud key."
        />
        <AgentInterface.Composer placeholder="Ask about sales, or refine the last dashboard…" />
        <SessionSync session={session} />
      </AgentInterface>
    </div>
  );
}
