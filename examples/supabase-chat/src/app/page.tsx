"use client";

import "@openuidev/react-ui/components.css";

import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function Page() {
  // Incrementing this key remounts ChatProvider, which re-runs fetchThreadList.
  // We bump it when a Realtime event signals that the thread list changed in
  // another tab so the sidebar stays in sync without a full page reload.
  const [threadListKey, setThreadListKey] = useState(0);

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
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "threads" },
          () => {
            // Remount ChatProvider so the thread sidebar refreshes.
            // Note: remounting clears the current in-progress conversation.
            // For production, consider a more granular update strategy.
            setThreadListKey((k) => k + 1);
          },
        )
        .subscribe();
    };

    init();

    return () => {
      channel?.unsubscribe();
    };
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <FullScreen
        key={threadListKey}
        processMessage={async ({ threadId, messages, abortController }) =>
          fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // Convert from OpenUI's internal format to OpenAI chat format
              messages: openAIMessageFormat.toApi(messages),
              threadId,
            }),
            signal: abortController.signal,
          })
        }
        streamProtocol={openAIAdapter()}
        // Tell OpenUI that the thread API stores / returns messages in
        // OpenAI chat format so loadThread deserialization stays aligned.
        messageFormat={openAIMessageFormat}
        threadApiUrl="/api/threads"
        agentName="Supabase Chat"
      />
    </div>
  );
}
