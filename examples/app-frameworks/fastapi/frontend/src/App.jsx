import "@openuidev/react-ui/styles/index.css";

import { library, ThemeProvider } from "@openuidev/intelligent-ui-library";
import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
  useSystemThemeMode,
} from "@openuidev/react-ui";
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
  const mode = useSystemThemeMode();

  // The Cloud system prompt is attached on the FastAPI side as a system message.
  return (
    <div className="h-screen w-screen overflow-hidden">
      <ThemeProvider mode={mode}>
        <AgentInterface
          llm={llm}
          storage={storage}
          componentLibrary={library}
          agentName="OpenUI Chat"
          theme={{ mode }}
        />
      </ThemeProvider>
    </div>
  );
}
