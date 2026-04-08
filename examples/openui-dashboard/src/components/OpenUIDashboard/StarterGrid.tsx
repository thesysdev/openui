"use client";

import { useDashboard } from "./context";
import type { Starter } from "@/starters";

interface StarterGridProps {
  starters: Starter[];
}

export function StarterGrid({ starters }: StarterGridProps) {
  const { send } = useDashboard();

  return (
    <div style={{ maxWidth: "700px", margin: "60px auto" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ fontSize: "40px", marginBottom: "8px" }}>⚡</div>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#111" }}>Build a dashboard</div>
        <div style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>Pick a starter or type your own prompt</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
        {starters.map((s) => (
          <button key={s.prompt} onClick={() => send(s.prompt)} style={{
            padding: "12px", border: "1px solid #e2e5e9", borderRadius: "10px",
            background: "white", cursor: "pointer", fontSize: "13px", textAlign: "left",
            transition: "all 0.15s", lineHeight: "1.4",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#111"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e5e9"; }}
          >
            <span style={{ fontSize: "16px" }}>{s.icon}</span>
            <div style={{ fontWeight: 600, marginTop: "4px", fontSize: "13px" }}>{s.label}</div>
            <div style={{ color: "#888", fontSize: "11px", marginTop: "2px" }}>
              {s.prompt.length > 50 ? s.prompt.slice(0, 50) + "..." : s.prompt}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
