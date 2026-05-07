"use client";

import type { Library } from "@openuidev/react-lang";
import "@openuidev/react-ui/components.css";
import { DashboardProvider, useDashboard } from "./context";
import { ConversationPanel } from "./ConversationPanel";
import { DashboardCanvas } from "./DashboardCanvas";

export { useDashboard } from "./context";

// ── Internal layout ───────────────────────────────────────────────────────────

function DashboardLayout({ library }: { library: Library }) {
  const { conversation, dashboardCode, isStreaming, clear } = useDashboard();
  const hasDashboard = dashboardCode !== null;

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

      {/* Main layout: dashboard + always-visible chat sidebar */}
      <div style={{ display: "flex", height: "calc(100vh - 49px)" }}>
        <div
          style={{
            flex: "1 1 0%",
            overflow: "auto",
            padding: "20px",
          }}
        >
          <DashboardCanvas library={library} />
        </div>
        <ConversationPanel />
      </div>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export interface OpenUIDashboardProps {
  library: Library;
  initialDashboardCode?: string;
  chatEndpoint?: string;
  mcpEndpoint?: string;
}

export function OpenUIDashboard({
  library,
  initialDashboardCode,
  chatEndpoint = "/api/chat",
  mcpEndpoint = "/api/mcp",
}: OpenUIDashboardProps) {
  return (
    <DashboardProvider chatEndpoint={chatEndpoint} mcpEndpoint={mcpEndpoint} initialDashboardCode={initialDashboardCode}>
      <DashboardLayout library={library} />
    </DashboardProvider>
  );
}
