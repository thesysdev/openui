"use client";

import { useState } from "react";
import { Renderer } from "@openuidev/react-lang";
import type { Library } from "@openuidev/react-lang";
import { ThemeProvider } from "@openuidev/react-ui";
import { useDashboard } from "./context";

interface DashboardCanvasProps {
  library: Library;
}

export function DashboardCanvas({ library }: DashboardCanvasProps) {
  const { dashboardCode, isStreaming, elapsed, toolProvider, send } = useDashboard();
  const [showSource, setShowSource] = useState(false);

  if (!dashboardCode && !isStreaming) return null;

  return (
    <>
      {dashboardCode && !isStreaming && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "8px", fontSize: "12px", color: "#888" }}>
          {elapsed && <span>{(elapsed / 1000).toFixed(1)}s</span>}
          <button onClick={() => setShowSource(!showSource)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#2563eb", fontSize: "12px", padding: 0,
          }}>{showSource ? "Hide code" : "View code"}</button>
        </div>
      )}

      {dashboardCode && showSource && (
        <pre style={{
          background: "#1e1e2e", color: "#cdd6f4", padding: "12px", borderRadius: "8px",
          fontSize: "11px", overflow: "auto", whiteSpace: "pre-wrap", maxHeight: "250px",
          lineHeight: "1.4", marginBottom: "12px",
        }}>{dashboardCode}</pre>
      )}

      {dashboardCode && (
        <div style={{
          border: "1px solid #e2e5e9", borderRadius: "12px", padding: "20px",
          background: "white", minHeight: "200px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <ThemeProvider>
            <Renderer
              response={dashboardCode}
              library={library}
              isStreaming={isStreaming}
              toolProvider={toolProvider}
              queryLoader={
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                  background: "linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                  animation: "openui-loading-bar 1.5s ease-in-out infinite",
                  zIndex: 10,
                }} />
              }
              onAction={(event) => {
                if (event.type === "continue_conversation") {
                  const contextText = typeof event.params?.context === "string"
                    ? event.params.context : "";
                  const text = contextText || event.humanFriendlyMessage || "";
                  if (text) send(text);
                }
              }}
            />
          </ThemeProvider>
        </div>
      )}

      {isStreaming && !dashboardCode && (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
          <div style={{ fontSize: "14px" }}>Generating dashboard...</div>
          {elapsed && <div style={{ fontSize: "12px", marginTop: "4px" }}>{(elapsed / 1000).toFixed(1)}s</div>}
        </div>
      )}
    </>
  );
}
