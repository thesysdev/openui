"use client";

import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
  useOpenuiCloudStorage,
  useSystemThemeMode,
} from "@openuidev/react-ui";
import { ChartLine, ChartPie, FileText, ShieldAlert, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { darkTheme, lightTheme } from "../lib/theme";
import { library } from "../library";
import { DocumentLibrary } from "./document-library";

// Send the thread's messages in Chat Completions format and read the runner's stream from the route.
const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: openAIReadableStreamAdapter(),
  messageFormat: openAIMessageFormat,
});

const starters = [
  {
    displayText: "Compare revenue and growth",
    prompt:
      "Compare total revenue and revenue growth for the latest fiscal year across NVIDIA, AMD, and Intel.",
    icon: <TrendingUp size={16} />,
  },
  {
    displayText: "How has R&D spending changed over three years?",
    prompt:
      "Compare how research and development spending changed over the last three fiscal years at NVIDIA, AMD, and Intel.",
    icon: <ChartLine size={16} />,
  },
  {
    displayText: "Break down revenue by segment",
    prompt: "Break down each company's revenue by reportable segment for the latest fiscal year.",
    icon: <ChartPie size={16} />,
  },
  {
    displayText: "What does each say about export controls?",
    prompt:
      "Compare what NVIDIA, AMD, and Intel say about U.S. export controls and China as a business risk.",
    icon: <ShieldAlert size={16} />,
  },
];

export default function ComparisonChat() {
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
    <div className="comparison-app">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={library}
        agentName="Filing analyst"
        logoUrl="/logo.svg"
        theme={theme}
        starters={starters}
        starterVariant="long"
      >
        <AgentInterface.Sidebar>
          <AgentInterface.SidebarHeader />
          <AgentInterface.SidebarContent>
            <AgentInterface.NewChatButton />
            <AgentInterface.SidebarItem path="documents" icon={<FileText size={16} />}>
              Documents
            </AgentInterface.SidebarItem>
            <AgentInterface.SidebarSeparator />
            <AgentInterface.ThreadList />
          </AgentInterface.SidebarContent>
        </AgentInterface.Sidebar>
        <AgentInterface.Route path="documents">
          <DocumentLibrary />
        </AgentInterface.Route>
        <AgentInterface.ThreadHeader>
          <span className="thread-context">
            Comparing <strong>NVIDIA</strong> · <strong>AMD</strong> · <strong>Intel</strong> annual
            reports
          </span>
        </AgentInterface.ThreadHeader>
        <AgentInterface.Welcome
          image={{ url: "/logo.svg" }}
          title="Compare annual reports"
          description="Ask about the latest Form 10-K filings from NVIDIA, AMD, and Intel. Every finding cites the page it came from."
        />
        <AgentInterface.Composer placeholder="What should I compare?" />
      </AgentInterface>
    </div>
  );
}
