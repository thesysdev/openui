"use client";

import { useTheme } from "@/hooks/use-system-theme";
import { emailChatLibrary } from "@/lib/react-email-genui";
import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import "@openuidev/react-ui/components.css";

export default function Page() {
  const mode = useTheme();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <FullScreen
        processMessage={async ({ messages, abortController }) => {
          return fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: openAIMessageFormat.toApi(messages),
            }),
            signal: abortController.signal,
          });
        }}
        streamProtocol={openAIAdapter()}
        componentLibrary={emailChatLibrary}
        agentName="Email Generator"
        theme={{ mode }}
        conversationStarters={{
          variant: "short",
          options: [
            {
              displayText: "Generate an email",
              prompt: "I want to generate an email",
            },
            {
              displayText: "Welcome email",
              prompt: "Create a welcome email for a SaaS product called Acme",
            },
            {
              displayText: "Newsletter",
              prompt: "Design a monthly newsletter email template with multiple sections",
            },
            {
              displayText: "Order confirmation",
              prompt: "Build an e-commerce order confirmation email with item details",
            },
          ],
        }}
      />
    </div>
  );
}
