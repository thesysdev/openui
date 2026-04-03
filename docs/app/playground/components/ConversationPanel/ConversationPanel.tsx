"use client";

import { Send, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage, ToolCallEntry } from "../../constants";
import "./ConversationPanel.css";

type ConversationPanelProps = {
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  elapsed: number | null;
  toolCalls: ToolCallEntry[];
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
  toolCalls,
  onSend,
  onStop,
  hasDashboard,
  responseHasCode,
}: ConversationPanelProps) {
  const [input, setInput] = useState("");
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

  const pendingTools = toolCalls.filter((t) => t.status === "pending");

  return (
    <div className="conv-panel">
      <div className="conv-header">Conversation</div>

      <div className="conv-messages">
        {messages.map((msg, i) => (
          <div key={i} className="conv-msg">
            {msg.role === "user" ? (
              <div className="conv-user-bubble">{msg.content}</div>
            ) : (
              <div className="conv-assistant">
                {/* Runtime tool call badges */}
                {msg.runtimeTools && msg.runtimeTools.length > 0 && (
                  <div className="conv-tools-badge conv-tools-runtime">
                    <div className="conv-tools-label">
                      <span>⚡</span> Live data fetched
                    </div>
                    <div className="conv-tools-list">
                      {msg.runtimeTools.map((tc, j) => (
                        <span
                          key={j}
                          className={`conv-tool-chip conv-tool-${tc.status}`}
                        >
                          {tc.status === "done"
                            ? "✓"
                            : tc.status === "error"
                              ? "✗"
                              : "⏳"}{" "}
                          {tc.tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text response */}
                {msg.text && (
                  <div className="conv-assistant-bubble">{msg.text}</div>
                )}

                {/* Dashboard updated badge */}
                {msg.hasCode && (
                  <span className="conv-code-badge">✓ dashboard updated</span>
                )}

                {/* Empty response */}
                {!msg.text && !msg.hasCode && !msg.runtimeTools?.length && (
                  <div className="conv-empty">(empty response)</div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="conv-msg">
            <div className="conv-assistant">
              {/* Live runtime tool calls */}
              {toolCalls.length > 0 && (
                <div className="conv-tools-badge conv-tools-live">
                  <div className="conv-tools-list">
                    <span className="conv-tools-label-text">
                      {pendingTools.length > 0 ? "Fetching" : "Loaded"}
                    </span>
                    {toolCalls.map((tc, j) => (
                      <span
                        key={j}
                        className={`conv-tool-chip conv-tool-${tc.status}`}
                      >
                        {tc.status === "pending" ? "⏳" : "✓"} {tc.tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Streaming text or thinking indicator */}
              {streamingText ? (
                <div className="conv-assistant-bubble">{streamingText}</div>
              ) : (
                <div className="conv-thinking">
                  {elapsed
                    ? `${(elapsed / 1000).toFixed(1)}s — ${responseHasCode ? "writing code..." : "thinking..."}`
                    : "thinking..."}
                </div>
              )}

              {/* Dashboard updating indicator */}
              {responseHasCode && (
                <span className="conv-code-badge conv-code-updating">
                  ⟳ updating dashboard...
                </span>
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
            <button className="conv-stop-btn" onClick={onStop}>
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              className="conv-send-btn"
              onClick={handleSend}
              disabled={!canSend}
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
