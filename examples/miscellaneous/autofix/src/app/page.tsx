"use client";

import { RepairMessage } from "@/components/repair-message";
import { createAutofixChat } from "@/lib/autofix-chat";
import { library } from "@/library";
import { AgentInterface, useSystemThemeMode } from "@openuidev/react-ui";
import { useMemo } from "react";

const starters = [
  {
    displayText: "Revenue summary",
    prompt:
      "Create a September revenue summary. Revenue is $48,200, up 12% from August. Include a title, the revenue metric, and a short explanation.",
  },
  {
    displayText: "Project health",
    prompt:
      "Show a project status card: 18 of 24 tasks completed, 3 blockers, and launch planned for October 15. Add a short next-step recommendation.",
  },
  {
    displayText: "Weekly fitness",
    prompt:
      "Create a weekly fitness summary with 4 workouts, 32 km running, and 7.5 hours average sleep. Add a motivating note.",
  },
];
const components = { AssistantMessage: RepairMessage };

export default function Page() {
  const mode = useSystemThemeMode();
  const llm = useMemo(() => createAutofixChat(), []);

  return (
    <main className="autofix-app">
      <AgentInterface
        llm={llm}
        componentLibrary={library}
        components={components}
        agentName="OpenUI Autofix"
        theme={{ mode }}
        starters={starters}
        starterVariant="short"
      >
        <AgentInterface.Welcome
          title="Describe the UI you need."
          description="OpenAI generates your interface. OpenUI validates it and automatically repairs errors with Autofix."
        />
        <AgentInterface.Composer placeholder="Ask for a summary, dashboard, or status card…" />
      </AgentInterface>
    </main>
  );
}
