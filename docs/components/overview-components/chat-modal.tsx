"use client";

import "@openuidev/react-ui/components.css";
import "./chat-modal.css";

import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { X } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

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
                {
                  displayText: "Revenue dashboard",
                  prompt:
                    "Build a revenue dashboard with a bar chart showing monthly revenue for Q4, key metrics, and a summary table.",
                },
                {
                  displayText: "Signup form",
                  prompt:
                    "Create a user registration form with name, email, password, and country fields with validation.",
                },
                {
                  displayText: "Compare React vs Vue",
                  prompt:
                    "Show me a comparison of React and Vue frameworks using tabs with pros, cons, and a feature comparison table.",
                },
                {
                  displayText: "Travel destinations",
                  prompt:
                    "Show me a carousel of 3 popular travel destinations with images, descriptions, and best time to visit.",
                },
              ],
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
