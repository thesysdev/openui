"use client";

import "@openuidev/react-ui/components.css";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import { useTheme } from "@/hooks/use-system-theme";
import { ChatHeader } from "@/components/chat-header";
import { ChatInput } from "@/components/chat-input";
import { ConversationStarters } from "@/components/conversation-starters";
import { AssistantMessage } from "@/components/assistant-message";
import { UserMessage } from "@/components/user-message";
import { ThinkingIndicator } from "@/components/thinking-indicator";

export default function Page() {
  useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, stop } = useChat();

  const isLoading = status === "submitted" || status === "streaming";

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
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950">
      <ChatHeader />

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
  );
}
