"use client";
import "@openuidev/react-ui/components.css";

import { useTheme } from "@/hooks/use-system-theme";
import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { artifactDemoLibrary } from "@/library";

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
        componentLibrary={artifactDemoLibrary}
        agentName="Artifact Demo"
        theme={{ mode }}
        conversationStarters={{
          variant: "short",
          options: [
            {
              displayText: "React login form",
              prompt:
                "Build me a React login form with email and password validation",
            },
            {
              displayText: "Python REST API",
              prompt:
                "Create a FastAPI REST API with CRUD endpoints for a todo app",
            },
            {
              displayText: "CSS animation",
              prompt:
                "Write a CSS animation for a bouncing loading indicator",
            },
            {
              displayText: "SQL schema",
              prompt:
                "Design a SQL schema for a blog with users, posts, and comments",
            },
          ],
        }}
      />
    </div>
  );
}
