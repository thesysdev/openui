"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  AgentInterface,
  agUIAdapter,
  useActiveDetailedView,
  useThread,
  useThreadList,
  useSystemThemeMode,
  type ChatLLM,
} from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { miniAppRenderer } from "@/lib/artifact-renderer";
import { miniAppsIn } from "@/lib/miniapp";
import { completedMessages, saveMessages, storage } from "@/lib/storage";

const artifactRenderers = [miniAppRenderer];
const artifactCategories = [{ name: "MiniApps", filter: { type: ["miniapp"] } }];

function Persistence({ selectedKeyRef }: { selectedKeyRef: RefObject<string | null> }) {
  const { activeDetailedViewId } = useActiveDetailedView();
  const { messages, isRunning, isLoadingMessages, setMessages } = useThread();
  const { selectedThreadId } = useThreadList();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    selectedKeyRef.current = activeDetailedViewId;
  }, [activeDetailedViewId, selectedKeyRef]);
  useEffect(() => {
    if (selectedThreadId && !isRunning && !isLoadingMessages) {
      const completed = completedMessages(messages);
      if (
        completed.length !== messages.length ||
        completed.some((message, index) => message !== messages[index])
      ) {
        setMessages(completed);
        return;
      }
      void saveMessages(selectedThreadId, messages)
        .then(() => setError(null))
        .catch(() =>
          setError(
            "Could not save this chat. Your browser's local storage may be full or disabled.",
          ),
        );
    }
  }, [selectedThreadId, messages, isRunning, isLoadingMessages, setMessages]);
  return error ? (
    <div className="storage-error" role="alert">
      {error}
    </div>
  ) : null;
}

export default function Home() {
  const mode = useSystemThemeMode();
  const selectedKeyRef = useRef<string | null>(null);
  const llm = useMemo<ChatLLM>(
    () => ({
      streamProtocol: agUIAdapter(),
      send: ({ threadId, messages, signal }) =>
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            threadId,
            selectedKey: selectedKeyRef.current,
            artifacts: miniAppsIn(messages),
            messages: messages
              .filter(
                (m) =>
                  (m.role === "user" || m.role === "assistant") &&
                  typeof m.content === "string" &&
                  m.content.trim(),
              )
              .map((m) => ({ role: m.role, content: m.content })),
          }),
        }),
    }),
    [],
  );
  return (
    <main className="app-shell">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={openuiChatLibrary}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
        agentName="MiniApps"
        theme={{ mode }}
        starters={[
          {
            displayText: "Compare npm downloads",
            prompt:
              "Build a dashboard comparing react and vue daily npm downloads over the last month. Include a period selector, totals, aligned line charts, and a detail table. Label the date window and missing data.",
          },
          {
            displayText: "Explore GitHub activity",
            prompt:
              "Build a GitHub dashboard for thesysdev/openui over the last 30 days. Include repository metrics, issue/pull-request and open/closed filters, grouped activity counts, a detail table, and a page selector. Clearly label pagination and partial counts.",
          },
          {
            displayText: "Visualize my data",
            prompt:
              'Build a revenue dashboard from these supplied records (USD): [{"month":"January","region":"North","revenue":120},{"month":"January","region":"South","revenue":80},{"month":"February","region":"North","revenue":200}]. Include a region selector, monthly totals, a chart, and a detail table. Keep missing month/region pairs missing.',
          },
        ]}
      >
        <Persistence selectedKeyRef={selectedKeyRef} />
      </AgentInterface>
    </main>
  );
}
