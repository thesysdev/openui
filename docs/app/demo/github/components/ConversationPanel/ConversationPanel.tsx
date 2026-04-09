"use client";

import { IconButton } from "@openuidev/react-ui";
import { MarkDownRenderer } from "@openuidev/react-ui/MarkDownRenderer";
import { ChevronRight, MessageSquare, Send, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../../constants";
import "./ConversationPanel.css";

type ConversationPanelProps = {
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  elapsed: number | null;
  onSend: (text: string) => void;
  onStop: () => void;
  hasDashboard: boolean;
  responseHasCode: boolean;
};

export function ConversationPanel({
  messages,
  streamingText,
  isStreaming,
  elapsed,
  onSend,
  onStop,
  hasDashboard,
  responseHasCode,
}: ConversationPanelProps) {
  const [input, setInput] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canSend = input.trim().length > 0 && !isStreaming;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    if (!isStreaming) inputRef.current?.focus();
  }, [isStreaming]);

  const handleSend = () => {
    if (!canSend) return;
    onSend(input.trim());
    setInput("");
  };

  if (collapsed) {
    return (
      <div className="conv-collapsed">
        <button
          className="conv-expand-btn"
          onClick={() => setCollapsed(false)}
          title="Expand conversation"
        >
          <MessageSquare size={16} />
          {messages.length > 0 && <span className="conv-badge">{messages.length}</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="conv-panel">
      <div className="conv-header">
        <span>Conversation</span>
        <button className="conv-collapse-btn" onClick={() => setCollapsed(true)} title="Collapse">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="conv-messages">
        {messages.map((msg, i) => (
          <div key={i} className="conv-msg">
            {msg.role === "user" ? (
              <div className="conv-user-bubble">{msg.content}</div>
            ) : (
              <div className="conv-assistant">
                {/* Text response */}
                {msg.text && (
                  <div className="conv-assistant-bubble">
                    <MarkDownRenderer textMarkdown={msg.text} />
                  </div>
                )}

                {/* Dashboard updated badge */}
                {msg.hasCode && <span className="conv-code-badge">✓ dashboard updated</span>}

                {/* Empty response */}
                {!msg.text && !msg.hasCode && <div className="conv-empty">(empty response)</div>}
              </div>
            )}
          </div>
        ))}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="conv-msg">
            <div className="conv-assistant">
              {/* Streaming text or thinking indicator */}
              {streamingText ? (
                <div className="conv-assistant-bubble">
                  <MarkDownRenderer textMarkdown={streamingText} />
                </div>
              ) : (
                <div className="conv-thinking">
                  {elapsed
                    ? `${(elapsed / 1000).toFixed(1)}s — ${responseHasCode ? "writing openui-lang..." : "thinking..."}`
                    : "thinking..."}
                </div>
              )}

              {/* Dashboard updating indicator */}
              {responseHasCode && (
                <span className="conv-code-badge conv-code-updating">⟳ updating dashboard...</span>
              )}
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="conv-input-area">
        <div className="conv-input-row">
          <input
            ref={inputRef}
            className="conv-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSend) handleSend();
            }}
            placeholder={hasDashboard ? "Edit or ask..." : "Describe a dashboard..."}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <IconButton
              className="conv-stop-btn"
              icon={<Square size={12} fill="currentColor" />}
              variant="tertiary"
              size="medium"
              onClick={onStop}
              aria-label="Stop generation"
            />
          ) : (
            <IconButton
              className="conv-send-btn"
              icon={<Send size={14} />}
              variant="primary"
              size="medium"
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
            />
          )}
        </div>
      </div>
    </div>
  );
}
