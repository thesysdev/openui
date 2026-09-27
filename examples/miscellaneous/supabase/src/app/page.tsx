"use client";

import { withStreamErrors } from "@/lib/stream-errors";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import {
  AgentInterface,
  fetchLLM,
  openAIAdapter,
  openAIMessageFormat,
  restStorage,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useEffect, useMemo } from "react";

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
        streamAdapter: withStreamErrors(openAIAdapter()),
        messageFormat: openAIMessageFormat,
      }),
    [],
  );

  useEffect(() => {
    const supabase = createSupabaseBrowser();

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
    };

    init();
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={openuiLibrary}
        agentName="Supabase Chat"
      />
    </div>
  );
}
