"use client";

import {
  AgentInterface,
  useOpenuiCloudStorage,
  type AgentInterfaceComponents,
  type ThemeProps,
} from "@openuidev/react-ui";
import { chatLLM } from "../lib/chat-client";
import { library } from "../library";
import { AnalyticsMessage } from "./analytics-message";

const theme: ThemeProps = { mode: "light" };
const components: AgentInterfaceComponents = { AssistantMessage: AnalyticsMessage };
const starters = [
  {
    displayText: "Compare February 2011 sales with January",
    prompt:
      "Compare gross sales, order count, and average order value in February 2011 with January across all countries.",
  },
  {
    displayText: "Chart Germany's daily sales in February 2011",
    prompt:
      "Show a bar chart of daily gross sales in Germany in February 2011, with the month's sales and order totals.",
  },
  {
    displayText: "Which products lost the most sales in November 2011?",
    prompt:
      "Which ten products had the largest drops in gross sales in November 2011 compared with October across all countries? Show both months and the difference in a table.",
  },
];

export default function RetailChat() {
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    features: { artifact: false },
  });
  return (
    <div className="retail-app">
      <AgentInterface
        llm={chatLLM}
        storage={storage}
        componentLibrary={library}
        components={components}
        agentName="Data analyst"
        theme={theme}
        starters={starters}
      >
        <AgentInterface.MobileHeader agentName="Data analyst" />
        <AgentInterface.Welcome
          title="Explore your data through conversation"
          description="Turn questions into charts, comparisons, and clear answers. Follow up to explore a different angle."
        />
        <AgentInterface.Composer placeholder="Ask a question about your data…" />
      </AgentInterface>
    </div>
  );
}
