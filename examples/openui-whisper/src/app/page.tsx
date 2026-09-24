"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import {
  ChatProvider,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
} from "@openuidev/react-headless";
import { openuiLibrary, openuiPromptOptions } from "@openuidev/react-ui/genui-lib";

import { VoiceCanvas } from "@/components/VoiceCanvas";

const systemPrompt = `${openuiLibrary.prompt(openuiPromptOptions)}\n\nAlways generate all UI text and content in English, regardless of the language the user speaks in.`;

export default function Home() {
  return (
    <ChatProvider
      streamProtocol={openAIReadableStreamAdapter()}
      processMessage={async ({ messages, abortController }) =>
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt,
            messages: openAIMessageFormat.toApi(messages),
          }),
          signal: abortController.signal,
        })
      }
    >
      <VoiceCanvas />
    </ChatProvider>
  );
}
