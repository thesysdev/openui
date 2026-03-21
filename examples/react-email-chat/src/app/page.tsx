"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/use-system-theme";
import {
  ChatProvider,
  openAIAdapter,
  openAIMessageFormat,
  useThread,
} from "@openuidev/react-headless";
import { ThemeProvider as OpenUIThemeProvider } from "@openuidev/react-ui";
import "@openuidev/react-ui/components.css";

import { ComposePage } from "@/components/compose-page";
import { ChatPage } from "@/components/chat-page";
import {
  saveView,
  loadView,
  saveMessages,
  loadMessages,
  clearSession,
} from "@/components/session";

// ── Main App (manages view state) ──

function EmailApp() {
  const [view, setView] = useState<"compose" | "chat">(() => loadView());
  const messages = useThread((s) => s.messages);
  const processMessage = useThread((s) => s.processMessage);
  const setMessages = useThread((s) => s.setMessages);
  const restoredRef = useRef<boolean | null>(null);

  // Restore messages from session during render (synchronous sessionStorage read)
  if (restoredRef.current === null) {
    restoredRef.current = true;
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

  return <ChatPage onNewEmail={handleNewEmail} />;
}

// ── Page Root ──

export default function Page() {
  const mode = useTheme();

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      <OpenUIThemeProvider mode={mode}>
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
      </OpenUIThemeProvider>
    </div>
  );
}
