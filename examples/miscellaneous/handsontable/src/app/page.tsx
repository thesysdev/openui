"use client";

import { MessageSquare } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { TableProvider } from "./TableContext";

const PersistentSpreadsheet = dynamic(() => import("./PersistentSpreadsheet"), { ssr: false });

export default function Home() {
  const [chatOpen, setChatOpen] = useState(true);

  const closeChat = useCallback(() => setChatOpen(false), []);

  useEffect(() => {
    window.dispatchEvent(new Event("resize"));
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
    return () => clearTimeout(t);
  }, [chatOpen]);

  return (
    <TableProvider>
      <div className="app-layout">
        <div className="spreadsheet-panel">
          <PersistentSpreadsheet />
        </div>

        {chatOpen && <ChatPanel onClose={closeChat} />}

        {!chatOpen && (
          <button onClick={() => setChatOpen(true)} className="chat-fab" aria-label="Open chat">
            <MessageSquare size={22} />
            <span className="chat-fab__label">AI Chat</span>
          </button>
        )}
      </div>
    </TableProvider>
  );
}
