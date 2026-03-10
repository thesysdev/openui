"use client";

import "@openuidev/react-ui/components.css";
import "./chat-modal.css";

import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { openuiChatLibrary, openuiChatPromptOptions } from "@openuidev/react-ui/genui-lib";
import { X } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

const systemPrompt = openuiChatLibrary.prompt(openuiChatPromptOptions);

interface ChatModalProps {
  onClose: () => void;
}

export function ChatModal({ onClose }: ChatModalProps) {
  const { resolvedTheme } = useTheme();

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  return createPortal(
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="chat-modal-close" onClick={onClose} aria-label="Close chat">
          <X size={20} />
        </button>
        <div className="chat-modal-body">
          <FullScreen
            welcomeMessage={{ title: "Hello, how can I help you today?" }}
            processMessage={async ({ messages, abortController }) => {
              return fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: openAIMessageFormat.toApi(messages),
                  systemPrompt,
                }),
                signal: abortController.signal,
              });
            }}
            streamProtocol={openAIAdapter()}
            componentLibrary={openuiChatLibrary}
            agentName="OpenUI Chat"
            theme={{ mode: (resolvedTheme as "light" | "dark") ?? "light" }}
            conversationStarters={{
              variant: "short",
              options: [
                { displayText: "Weather in Tokyo", prompt: "What's the weather like in Tokyo right now?" },
                { displayText: "AAPL stock price", prompt: "What's the current Apple stock price?" },
                { displayText: "Contact form", prompt: "Build me a contact form with name, email, topic, and message fields." },
                { displayText: "Data table", prompt: "Show me a table of the top 5 programming languages by popularity with year created." },
              ],
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
