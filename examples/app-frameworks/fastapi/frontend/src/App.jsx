import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

export default function App() {
  // Storage is AgentInterface's built-in in-memory default (wiped on reload).
  // The Cloud system prompt is attached on the FastAPI side as a system message.
  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: openAIReadableStreamAdapter(),
        messageFormat: openAIMessageFormat,
      }),
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface llm={llm} componentLibrary={openuiLibrary} agentName="OpenUI Chat" />
    </div>
  );
}
