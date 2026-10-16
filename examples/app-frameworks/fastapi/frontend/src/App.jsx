import "@openuidev/react-ui/styles/index.css";

import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { localStorageChat } from "./lib/local-storage";

const { llm, storage } = localStorageChat(
  fetchLLM({
    url: "/api/chat",
    streamAdapter: openAIReadableStreamAdapter(),
    messageFormat: openAIMessageFormat,
  }),
  "openui-fastapi",
);

export default function App() {
  // The Cloud system prompt is attached on the FastAPI side as a system message.
  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={openuiLibrary}
        agentName="OpenUI Chat"
      />
    </div>
  );
}
