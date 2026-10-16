"use client";

import { localStorageChat } from "@/lib/local-storage";
import { library } from "@/library";
import {
  AgentInterface,
  openAIAdapter,
  openAIMessageFormat,
  useSystemThemeMode,
} from "@openuidev/react-ui";

const { llm, storage } = localStorageChat(
  {
    send: ({ messages, signal }) =>
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: openAIMessageFormat.toApi(messages) }),
        signal,
      }),
    streamProtocol: openAIAdapter(),
  },
  "openui-html-artifact",
);

export default function Page() {
  const mode = useSystemThemeMode();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={library}
        agentName="HTML Artifact"
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "Physics simulator",
            prompt:
              "Build an interactive orbital decay simulator with controls for altitude and satellite mass.",
          },
          {
            displayText: "Sorting visualizer",
            prompt:
              "Build an animated sorting algorithm visualizer that compares bubble sort and quicksort.",
          },
          {
            displayText: "Mortgage calculator",
            prompt: "Build an interactive mortgage calculator with a payment breakdown chart.",
          },
          {
            displayText: "Music sequencer",
            prompt: "Build a playful 8-step browser drum sequencer with tempo controls.",
          },
        ]}
      />
    </div>
  );
}
