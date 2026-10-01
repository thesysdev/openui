"use client";

import {
  agUIAdapter,
  ChatProvider,
  fetchLLM,
  openAIMessageFormat,
  useThread,
  useThreadList,
  type Thread,
} from "@openuidev/react-headless";
import { ThemeProvider } from "@openuidev/react-ui";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChatShell } from "../../components/chat-shell";
import { Sidebar, type SidebarThread } from "../../components/sidebar";
import { f1Theme } from "../../f1-typography";
import { RadioThread } from "./radio-thread";
import { RadioWelcome } from "./radio-welcome";
import { hasThread, localThreadStorage, saveMessages } from "./thread-storage";

/*
 * The Radio chat. /design opens a new conversation and /design/[threadId] an
 * earlier one. It lives in the layout so the provider, sidebar and input stay
 * mounted while the URL moves from /design to the new thread's address mid-answer.
 * It talks to the same /api/chat route and F1 library as the / chat.
 */

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: agUIAdapter(),
  messageFormat: openAIMessageFormat,
});

// The route takes questions of up to 600 characters.
const MAX_QUESTION = 600;

// Sidebar second line: when the conversation started.
function when(createdAt: Thread["createdAt"]) {
  const date = new Date(createdAt);
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString(undefined, { weekday: "short" });
  if (days < 14) return "Last week";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// Keeps each thread's messages in local storage: right away when a run ends, and
// at most once a second while one streams.
function PersistThread() {
  const threadId = useThreadList((s) => s.selectedThreadId);
  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const isLoading = useThread((s) => s.isLoadingMessages);
  const lastSave = useRef(0);
  useEffect(() => {
    if (!threadId || isLoading || !messages.length) return;
    const now = Date.now();
    if (isRunning && now - lastSave.current < 1000) return;
    lastSave.current = now;
    saveMessages(threadId, messages);
  }, [threadId, messages, isRunning, isLoading]);
  return null;
}

function RadioChat() {
  const router = useRouter();
  const params = useParams<{ threadId?: string }>();
  const routeThread = params.threadId ?? null;
  const [collapsed, setCollapsed] = useState(true);

  const threads = useThreadList((s) => s.threads);
  const selectedThreadId = useThreadList((s) => s.selectedThreadId);
  const loadThreads = useThreadList((s) => s.loadThreads);
  const selectThread = useThreadList((s) => s.selectThread);
  const switchToNewThread = useThreadList((s) => s.switchToNewThread);
  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const processMessage = useThread((s) => s.processMessage);

  useEffect(loadThreads, [loadThreads]);

  // The URL picks the conversation. An unknown thread falls back to a new one.
  useEffect(() => {
    if (!routeThread) return switchToNewThread();
    if (hasThread(routeThread)) selectThread(routeThread);
    else router.replace("/design");
  }, [routeThread, selectThread, switchToNewThread, router]);

  // The first question creates the thread; move the URL onto it without remounting anything.
  useEffect(() => {
    if (selectedThreadId && selectedThreadId !== routeThread) router.replace(`/design/${selectedThreadId}`);
    // Only when the store picks a new thread, not when the URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId]);

  const sidebarThreads = useMemo<SidebarThread[]>(
    () => threads.map((t) => ({ id: t.id, title: t.title, meta: when(t.createdAt) })),
    [threads],
  );

  return (
    // The carbon sidebar floats on the left; the chat page fills the rest.
    <div style={{ position: "relative", height: "100dvh", paddingLeft: collapsed ? 52 : 280, background: "#FFFFFF", transition: "padding-left 180ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
      <Sidebar
        floating
        threads={sidebarThreads}
        activeThread={routeThread}
        liveThread={isRunning ? selectedThreadId : null}
        onCollapsedChange={setCollapsed}
        onNavigate={(id) => id === "home" && router.push("/design")}
        onOpenThread={(id) => router.push(`/design/${id}`)}
        onNewChat={() => (router.push("/design"), document.querySelector<HTMLInputElement>(".radio-input input")?.focus())}
      />
      <ChatShell
        threadKey={routeThread}
        // A new chat (no thread in the URL) opens on the welcome and starting grid.
        empty={routeThread ? null : <RadioWelcome onPick={(prompt) => processMessage({ role: "user", content: prompt })} />}
        input={{
          busy: isRunning,
          maxLength: MAX_QUESTION,
          onSend: (text) => processMessage({ role: "user", content: text }),
        }}
      >
        {messages.length > 0 && <RadioThread />}
      </ChatShell>
    </div>
  );
}

export default function DesignLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider mode="light" lightTheme={f1Theme}>
      <ChatProvider llm={llm} storage={localThreadStorage}>
        <PersistThread />
        <RadioChat />
        {children}
      </ChatProvider>
    </ThemeProvider>
  );
}
