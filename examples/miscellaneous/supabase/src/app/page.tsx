"use client";

import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useThreadList } from "@openuidev/react-headless";
import {
  AgentInterface,
  fetchLLM,
  openAIAdapter,
  openAIMessageFormat,
  restStorage,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useMemo } from "react";

// Keeps the sidebar in sync with the threads table. On any Realtime change it
// reloads only the thread list, so the open conversation stays where it is.
function ThreadListSync() {
  const loadThreads = useThreadList((s) => s.loadThreads);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    let channel: RealtimeChannel | undefined;

    const init = async () => {
      // Ensure an anonymous session exists.
      // Anonymous users get a stable UUID that persists across page refreshes
      // and is used to scope threads via Row Level Security.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
      }

      // Fires whenever any thread is created, updated, or deleted —
      // including from another tab or device logged in with the same account.
      channel = supabase
        .channel("threads-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "threads" }, () =>
          loadThreads(),
        )
        .subscribe();
    };

    init();

    return () => {
      channel?.unsubscribe();
    };
  }, [loadThreads]);

  return null;
}

export default function Page() {
  // Thread persistence stays server-backed (Supabase) via the same /api/threads
  // REST contract the legacy `threadApiUrl` used — restStorage reproduces those
  // conventions and keeps loadThread deserialization aligned with OpenAI format.
  const storage = useMemo(
    () => restStorage({ baseUrl: "/api/threads", messageFormat: openAIMessageFormat }),
    [],
  );
  // fetchLLM POSTs { threadId, runId, messages, tools, context }; the route
  // reads the top-level threadId and messages (OpenAI chat format via
  // openAIMessageFormat) and ignores the rest.
  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: openAIAdapter(),
        messageFormat: openAIMessageFormat,
      }),
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={openuiLibrary}
        agentName="Supabase Chat"
      >
        <ThreadListSync />
      </AgentInterface>
    </div>
  );
}
