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
import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import { useEffect, useMemo } from "react";

// Ensure an anonymous session exists.
// Anonymous users get a stable UUID that persists across page refreshes
// and is used to scope threads via Row Level Security.
// Shared by every mount: React runs effects twice in development, and two
// sign-ins at once would leave the page and Realtime on different users.
let sessionReady: Promise<{ session: Session | null; isNew: boolean }> | null = null;

function ensureSession(supabase: ReturnType<typeof createSupabaseBrowser>) {
  sessionReady ??= (async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return { session, isNew: false };
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) sessionReady = null; // let the next mount try again
    return { session: data.session, isNew: true };
  })();
  return sessionReady;
}

// Keeps the sidebar in sync with the threads table. On any Realtime change it
// reloads only the thread list, so the open conversation stays where it is.
function ThreadListSync() {
  const loadThreads = useThreadList((s) => s.loadThreads);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    let channel: RealtimeChannel | undefined;
    let cancelled = false;

    const init = async () => {
      const { session, isNew } = await ensureSession(supabase);
      if (cancelled) return;
      // The first list ran before the session existed; list again now.
      if (isNew) loadThreads();

      // Join Realtime as the signed-in user. If the channel joins before the
      // client has picked up the session, Row Level Security hides every
      // change and the sidebar never updates.
      if (session) await supabase.realtime.setAuth(session.access_token);
      if (cancelled) return;

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
      cancelled = true;
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
