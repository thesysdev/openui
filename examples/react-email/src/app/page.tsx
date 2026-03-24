"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChatProvider,
  openAIAdapter,
  openAIMessageFormat,
  useThread,
} from "@openuidev/react-headless";

import { ComposePage } from "@/components/composePage";
import { EmailEditor } from "@/components/emailEditor";
import {
  saveView,
  loadView,
  saveMessages,
  loadMessages,
  clearSession,
} from "@/components/session";

// ── Main App (manages view state) ──

function EmailApp() {
  const [view, setView] = useState<"compose" | "chat">("compose");
  const messages = useThread((s) => s.messages);
  const processMessage = useThread((s) => s.processMessage);
  const setMessages = useThread((s) => s.setMessages);
  const restoredRef = useRef<boolean | null>(null);

  // Restore view and messages synchronously on first render (not in effect)
  if (restoredRef.current === null) {
    restoredRef.current = true;
    const savedView = loadView();
    if (savedView === "chat") setView("chat");
    const saved = loadMessages();
    if (saved && saved.length > 0) {
      setMessages(saved as Parameters<typeof setMessages>[0]);
    }
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
    setMessages([]);
    setView("compose");
    clearSession();
  }, [setMessages]);

  if (view === "compose") {
    return <ComposePage onSend={handleSend} />;
  }

  return <EmailEditor onNewEmail={handleNewEmail} />;
}

// ── Page Root ──

export default function Page() {
  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      <ChatProvider
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
      >
        <EmailApp />
      </ChatProvider>
    </div>
  );
}
