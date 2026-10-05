"use client";

import { createSupabaseBrowser } from "@/lib/supabase/browser";
import {
  AgentInterface,
  fetchLLM,
  openAIAdapter,
  openAIMessageFormat,
  restStorage,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

export default function Page() {
  // Incrementing this key remounts ChatProvider, which re-runs fetchThreadList.
  // We bump it when a Realtime event signals that the thread list changed in
  // another tab so the sidebar stays in sync without a full page reload.
  const [threadListKey, setThreadListKey] = useState(0);

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

      // Subscribe to Realtime changes on the threads table.
      // This fires whenever any thread is created, updated, or deleted —
      // including from another tab or device logged in with the same account.
      channel = supabase
        .channel("threads-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "threads" }, () => {
          // Remount ChatProvider so the thread sidebar refreshes.
          // Note: remounting clears the current in-progress conversation.
          // For production, consider a more granular update strategy.
          setThreadListKey((k) => k + 1);
        })
        .subscribe();
    };

    init();

    return () => {
      channel?.unsubscribe();
    };
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface
        key={threadListKey}
        storage={storage}
        llm={llm}
        componentLibrary={openuiLibrary}
        agentName="Supabase Chat"
      />
    </div>
  );
}
