"use client";

import { useEffect, useRef, useState } from "react";
import { MarkDownRenderer } from "@openuidev/react-ui";
import { useDashboard } from "./context";

const SUGGESTIONS = [
  { label: "Revenue trend", prompt: "Add a revenue trend chart showing Stripe balance transactions over the last 30 days" },
  { label: "Conversion funnel", prompt: "Add a conversion funnel widget using PostHog with pageview, sign_up, and purchase steps" },
  { label: "Commit velocity", prompt: "Add a commit activity chart for my most active GitHub repo over the past year" },
  { label: "Weekly calendar", prompt: "Add a calendar widget showing my events for the next 7 days" },
  { label: "Recent charges", prompt: "Add a table of the 10 most recent Stripe charges with amount, status, and description" },
  { label: "Team contributors", prompt: "Add a contributor breakdown chart for my most active GitHub repo" },
];

export function ConversationPanel() {
  const {
    conversation, isStreaming, streamingText, streamingHasCode,
    llmTools, toolCalls, elapsed, dashboardCode, send,
  } = useDashboard();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const hasDashboard = dashboardCode !== null;
  const canSend = input.trim().length > 0 && !isStreaming;
  const pendingTools = toolCalls.filter((t) => t.status === "pending");
  const isEmpty = conversation.length === 0 && !isStreaming;

  useEffect(() => { inputRef.current?.focus(); }, [isStreaming]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation]);

  const handleSend = () => {
    if (!canSend) return;
    send(input);
    setInput("");
  };

  return (
    <div style={{
      width: "340px", minWidth: "340px", borderLeft: "1px solid #e5e7eb",
      background: "white", display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "13px", fontWeight: 600, color: "#374151" }}>
        Conversation
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
        {isEmpty && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "10px" }}>
              Add a widget to your dashboard
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.prompt)}
                  style={{
                    padding: "5px 10px",
                    border: "1px solid #e2e5e9",
                    borderRadius: "16px",
                    background: "#f9fafb",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#374151",
                    transition: "all 0.15s",
                    lineHeight: "1.3",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#111";
                    e.currentTarget.style.background = "#f0f4ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e5e9";
                    e.currentTarget.style.background = "#f9fafb";
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {conversation.map((msg, i) => (
          <div key={i} style={{ marginBottom: "12px" }}>
            {msg.role === "user" ? (
              <div style={{
                background: "#f0f4ff", color: "#1e40af", padding: "8px 12px",
                borderRadius: "10px", fontSize: "13px", lineHeight: "1.4",
                marginLeft: "40px",
              }}>{msg.content}</div>
            ) : (
              <div style={{ marginRight: "20px" }}>
                {msg.llmTools && msg.llmTools.length > 0 && (
                  <div style={{
                    padding: "6px 10px", borderRadius: "8px", marginBottom: "6px",
                    background: "#f0f4ff", border: "1px solid #dbeafe", fontSize: "11px",
                  }}>
                    <div style={{ color: "#1d4ed8", fontWeight: 600, marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>🔍</span> Queried data
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                      {msg.llmTools.map((tc, j) => (
                        <span key={j} style={{
                          padding: "1px 6px", borderRadius: "4px",
                          background: tc.status === "done" ? "#dbeafe" : "#e0e7ff",
                          color: "#1e40af", fontSize: "10px",
                        }}>✓ {tc.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                {msg.text && (
                  <div style={{
                    background: "#f9fafb", border: "1px solid #e5e7eb",
                    padding: "8px 12px", borderRadius: "10px", fontSize: "13px",
                    lineHeight: "1.5", color: "#374151",
                  }}>
                    <MarkDownRenderer textMarkdown={msg.text} />
                  </div>
                )}
                {msg.hasCode && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    padding: "2px 8px", borderRadius: "8px", fontSize: "11px",
                    background: "#ecfdf5", color: "#059669", marginTop: msg.text ? "4px" : "0",
                  }}>✓ dashboard updated</div>
                )}
                {msg.runtimeTools && msg.runtimeTools.length > 0 && (
                  <div style={{
                    marginTop: "6px", padding: "6px 10px", borderRadius: "8px",
                    background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "11px",
                  }}>
                    <div style={{ color: "#15803d", fontWeight: 600, marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>⚡</span> Live data fetched
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                      {msg.runtimeTools.map((tc, j) => (
                        <span key={j} style={{
                          padding: "1px 6px", borderRadius: "4px",
                          background: tc.status === "done" ? "#dcfce7" : tc.status === "error" ? "#fef2f2" : "#fef3c7",
                          color: tc.status === "done" ? "#166534" : tc.status === "error" ? "#991b1b" : "#92400e",
                          fontSize: "10px",
                        }}>{tc.status === "done" ? "✓" : tc.status === "error" ? "✗" : "⏳"} {tc.tool}</span>
                      ))}
                    </div>
                  </div>
                )}
                {!msg.text && !msg.hasCode && !msg.llmTools?.length && (
                  <div style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>
                    (empty response)
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isStreaming && (
          <div style={{ marginBottom: "12px", marginRight: "20px" }}>
            {llmTools.length > 0 && llmTools.some((t) => t.status === "calling") && (
              <div style={{ fontSize: "11px", color: "#1d4ed8", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <span>🔍</span>
                <span>Querying {llmTools.filter((t) => t.status === "calling").length} tool{llmTools.filter((t) => t.status === "calling").length > 1 ? "s" : ""}...</span>
              </div>
            )}
            {streamingText ? (
              <div style={{
                background: "#f9fafb", border: "1px solid #e5e7eb",
                padding: "8px 12px", borderRadius: "10px", fontSize: "13px",
                lineHeight: "1.5", color: "#374151",
              }}>
                <MarkDownRenderer textMarkdown={streamingText} />
              </div>
            ) : (
              <div style={{
                background: "#f9fafb", border: "1px solid #e5e7eb",
                padding: "8px 12px", borderRadius: "10px", fontSize: "13px", color: "#059669",
              }}>
                {llmTools.length > 0 && llmTools.some((t) => t.status === "calling")
                  ? "fetching data before generating..."
                  : elapsed
                    ? `${(elapsed / 1000).toFixed(1)}s — ${streamingHasCode ? "writing code..." : "thinking..."}`
                    : "thinking..."}
              </div>
            )}
            {streamingHasCode && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "2px 8px", borderRadius: "8px", fontSize: "11px",
                background: "#ecfdf5", color: "#059669", marginTop: "4px",
              }}>⟳ updating dashboard...</div>
            )}
            {toolCalls.length > 0 && (
              <div style={{
                marginTop: "4px", padding: "4px 8px", borderRadius: "6px",
                background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "10px",
              }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {pendingTools.length > 0 ? "Fetching" : "Loaded"}
                  </span>
                  {toolCalls.map((tc, j) => (
                    <span key={j} style={{
                      padding: "1px 5px", borderRadius: "3px",
                      background: tc.status === "pending" ? "#fef3c7" : tc.status === "done" ? "#ecfdf5" : "#fef2f2",
                      color: tc.status === "pending" ? "#92400e" : tc.status === "done" ? "#065f46" : "#991b1b",
                    }}>{tc.status === "pending" ? "⏳" : "✓"} {tc.tool}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder={hasDashboard ? "Add a widget or ask a question..." : "Describe a dashboard..."}
            disabled={isStreaming}
            style={{
              flex: 1, padding: "8px 12px", border: "1px solid #d1d5db",
              borderRadius: "8px", fontSize: "13px", outline: "none",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              padding: "8px 16px", border: "none", borderRadius: "8px",
              background: canSend ? "#111" : "#d1d5db", color: "white",
              cursor: canSend ? "pointer" : "not-allowed", fontSize: "13px", fontWeight: 600,
            }}
          >{isStreaming ? "..." : "Send"}</button>
        </div>
      </div>
    </div>
  );
}
