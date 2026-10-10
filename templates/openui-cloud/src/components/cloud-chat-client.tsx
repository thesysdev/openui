"use client";

import { Loader } from "lucide-react";
import dynamic from "next/dynamic";
import "./boot-shell.css";

// Drawn while the chat's code loads: the same shell (rail + card) with the
// loading spinner in the card, so nothing jumps when the real UI arrives. The
// rail's width comes from the pre-paint script in layout.tsx.
function BootShell() {
  return (
    <div className="openui-cloud-page">
      <div className="openui-agent-container">
        <div className="openui-agent-sidebar-container boot-shell__rail" />
        <div className="openui-agent-thread-container">
          <div className="openui-agent-ambient-loader" role="status" aria-live="polite">
            <span className="openui-agent-ambient-loader__status">
              <Loader size={20} className="openui-agent-ambient-loader__spinner" aria-hidden="true" />
              <span className="openui-agent-ambient-loader__label">Loading…</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Client-only, so the sidebar's saved open state and width (localStorage) are
// in place for the first paint instead of the server's defaults flipping on
// hydration.
const CloudChat = dynamic(() => import("@/components/cloud-chat"), {
  ssr: false,
  loading: BootShell,
});

export default function CloudChatClient() {
  return <CloudChat />;
}
