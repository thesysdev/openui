"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import {
  AgentInterface,
  fetchLLM,
  langGraphAdapter,
  langGraphMessageFormat,
  useSystemThemeMode,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

// The /api/chat route runs the LangGraph agent in-process and streams its
// native `messages`-mode SSE. Outgoing messages are converted to LangChain
// shape here so the route can pass them to the graph as-is.
const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: langGraphAdapter(),
  messageFormat: langGraphMessageFormat,
});

export default function Home() {
  const mode = useSystemThemeMode();

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      <AgentInterface
        llm={llm}
        componentLibrary={openuiLibrary}
        agentName="OpenUI Self Hosted"
        theme={{ mode }}
      />
    </div>
  );
}
