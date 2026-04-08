"use client";

import type { Starter } from "@/starters";
import type { Library } from "@openuidev/react-lang";
import "@openuidev/react-ui/components.css";
import { useRef, useState } from "react";
import { DashboardProvider, useDashboard } from "./context";
import { ConversationPanel } from "./ConversationPanel";
import { DashboardCanvas } from "./DashboardCanvas";
import { StarterGrid } from "./StarterGrid";

export { useDashboard } from "./context";

// ── Internal layout ───────────────────────────────────────────────────────────

function DashboardLayout({ library, starters }: { library: Library; starters: Starter[] }) {
  const { conversation, dashboardCode, isStreaming, clear } = useDashboard();
  const hasDashboard = dashboardCode !== null;
  const isEmpty = conversation.length === 0 && !hasDashboard;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafbfc",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          borderBottom: "1px solid #e5e7eb",
          background: "white",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <h1 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>openui-lang</h1>
        <span style={{ fontSize: "12px", color: "#888" }}>Live Demo</span>
        <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
          {["Live Data", "Streaming", "Conversational"].map((label, i) => (
            <span
              key={label}
              style={{
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: 500,
                background: ["#ecfdf5", "#eff6ff", "#fef3c7"][i],
                color: ["#059669", "#2563eb", "#d97706"][i],
              }}
            >
              {label}
            </span>
          ))}
        </div>
        {(hasDashboard || conversation.length > 0) && (
          <button
            onClick={clear}
            style={{
              padding: "4px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              background: "white",
              cursor: "pointer",
              fontSize: "12px",
              color: "#666",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Main layout */}
      <div style={{ display: "flex", height: "calc(100vh - 49px)" }}>
        <div
          style={{
            flex: hasDashboard ? "1 1 60%" : "1 1 100%",
            overflow: "auto",
            padding: "20px",
            transition: "flex 0.3s",
          }}
        >
          {isEmpty && <StarterGrid starters={starters} />}
          <DashboardCanvas library={library} />
        </div>
        {(conversation.length > 0 || isStreaming) && <ConversationPanel />}
      </div>

      {isEmpty && !isStreaming && <CenteredInput />}
    </div>
  );
}

function CenteredInput() {
  const { send, isStreaming } = useDashboard();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const canSend = input.trim().length > 0 && !isStreaming;

  const handleSend = () => {
    if (!canSend) return;
    send(input);
    setInput("");
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(600px, calc(100% - 48px))",
      }}
    >
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Describe a dashboard..."
          style={{
            flex: 1,
            padding: "14px 18px",
            border: "1px solid #d1d5db",
            borderRadius: "12px",
            fontSize: "14px",
            outline: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            padding: "14px 24px",
            border: "none",
            borderRadius: "12px",
            background: canSend ? "#111" : "#d1d5db",
            color: "white",
            cursor: canSend ? "pointer" : "not-allowed",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export interface OpenUIDashboardProps {
  library: Library;
  starters?: Starter[];
  chatEndpoint?: string;
  mcpEndpoint?: string;
}

export function OpenUIDashboard({
  library,
  starters = [],
  chatEndpoint = "/api/chat",
  mcpEndpoint = "/api/mcp",
}: OpenUIDashboardProps) {
  return (
    <DashboardProvider chatEndpoint={chatEndpoint} mcpEndpoint={mcpEndpoint}>
      <DashboardLayout library={library} starters={starters} />
    </DashboardProvider>
  );
}
