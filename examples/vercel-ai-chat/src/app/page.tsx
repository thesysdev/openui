"use client";

import "@openuidev/react-ui/components.css";

import { AssistantMessage } from "@/components/assistant-message";
import { ChatHeader } from "@/components/chat-header";
import { ChatInput } from "@/components/chat-input";
import { ConversationStarters } from "@/components/conversation-starters";
import { Sidebar } from "@/components/sidebar";
import { ThinkingIndicator } from "@/components/thinking-indicator";
import { UserMessage } from "@/components/user-message";
import { useTheme } from "@/hooks/use-system-theme";
import { useThreads } from "@/hooks/use-threads";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const {
    threads,
    activeThreadId,
    activeThread,
    sidebarOpen,
    setSidebarOpen,
    persistMessages,
    createThread,
    switchThread,
    deleteThread,
  } = useThreads();

  const { messages, sendMessage, status, stop } = useChat({
    id: activeThreadId,
    messages: activeThread?.messages,
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      persistMessages(messages);
    }
  }, [messages, persistMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage({ text: trimmed });
  };

  const isEmpty = messages.length === 0;
  const lastIsUser = messages[messages.length - 1]?.role === "user";

  return (
    <div className="h-screen bg-white dark:bg-zinc-950">
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        isOpen={sidebarOpen}
        onNewChat={createThread}
        onSelectThread={switchThread}
        onDeleteThread={deleteThread}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className={`flex flex-col h-full transition-[margin] duration-200 ease-in-out ${
          sidebarOpen ? "md:ml-[280px]" : "ml-0"
        }`}
      >
        <ChatHeader isSidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((o) => !o)} />

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <ConversationStarters onSelect={handleSend} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((m, i) => {
                const isLast = i === messages.length - 1;
                if (m.role === "assistant") {
                  return (
                    <AssistantMessage
                      key={m.id}
                      message={m}
                      isStreaming={isLoading && isLast}
                      onSend={handleSend}
                    />
                  );
                }
                if (m.role === "user") {
                  return <UserMessage key={m.id} message={m} />;
                }
                return null;
              })}
              {isLoading && lastIsUser && <ThinkingIndicator />}
            </div>
          )}
        </div>

        <ChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={setInput}
          onSend={handleSend}
          onStop={stop}
        />
      </div>
    </div>
  );
}
