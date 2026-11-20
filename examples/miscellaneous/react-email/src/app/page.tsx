"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChatProvider,
  fetchLLM,
  openAIAdapter,
  openAIMessageFormat,
  useThread,
  useThreadList,
} from "@openuidev/react-headless";

import { ComposePage } from "@/components/composePage";
import { EmailEditor } from "@/components/emailEditor";
import {
  saveView,
  loadView,
  saveMessages,
  loadThreadId,
  clearSession,
  emailStorage,
} from "@/components/session";

// ── Main App (manages view state) ──

function EmailApp() {
  const [view, setView] = useState<"compose" | "chat">("compose");
  const messages = useThread((s) => s.messages);
  const processMessage = useThread((s) => s.processMessage);
  const selectThread = useThreadList((s) => s.selectThread);
  const switchToNewThread = useThreadList((s) => s.switchToNewThread);
  const restoredRef = useRef<boolean | null>(null);

  // Restore view and thread on first render (not in effect)
  if (restoredRef.current === null) {
    restoredRef.current = true;
    const savedView = loadView();
    if (savedView === "chat") setView("chat");
    // Reopen the saved email's thread: emailStorage loads its messages.
    const savedThreadId = loadThreadId();
    if (savedThreadId) selectThread(savedThreadId);
  }

  // Persist messages to session whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  const handleSend = useCallback(
    (message: string) => {
      setView("chat");
      saveView("chat");
      processMessage({ role: "user", content: message });
    },
    [processMessage]
  );

  const handleNewEmail = useCallback(() => {
    // A new thread, so the next email gets its own session ID.
    switchToNewThread();
    setView("compose");
    clearSession();
  }, [switchToNewThread]);

  if (view === "compose") {
    return <ComposePage onSend={handleSend} />;
  }

  return <EmailEditor onNewEmail={handleNewEmail} />;
}

// ── Page Root ──

export default function Page() {
  // fetchLLM POSTs the run payload to /api/chat, sending messages in OpenAI
  // format and parsing the OpenAI-style SSE response.
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
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      <ChatProvider llm={llm} storage={emailStorage}>
        <EmailApp />
      </ChatProvider>
    </div>
  );
}
