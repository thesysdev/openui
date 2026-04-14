"use client";

import "@openuidev/react-ui/components.css";
import { openAIMessageFormat, openAIAdapter } from "@openuidev/react-headless";
import { Copilot } from "@openuidev/react-ui";
import { spreadsheetLibrary } from "@/lib/spreadsheet-library";
import { TableProvider, useTableContext } from "./TableContext";
import { useState, useEffect, useCallback } from "react";
import { MessageSquare, PanelRightClose } from "lucide-react";
import dynamic from "next/dynamic";

const PersistentSpreadsheet = dynamic(
  () => import("./PersistentSpreadsheet"),
  { ssr: false }
);

function ChatPanel({ onClose }: { onClose: () => void }) {
  const { threadId } = useTableContext();

  return (
    <div className="chat-panel">
      <div className="chat-panel__close-row">
        <button onClick={onClose} className="chat-close-btn" aria-label="Close chat">
          <PanelRightClose size={18} />
        </button>
      </div>
      <div className="chat-panel__body">
        <Copilot
          processMessage={async ({ messages, abortController }) => {
            return fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: openAIMessageFormat.toApi(messages),
                threadId,
              }),
              signal: abortController.signal,
            });
          }}
          streamProtocol={openAIAdapter()}
          componentLibrary={spreadsheetLibrary}
          agentName="Spreadsheet AI"
          welcomeMessage={{
            title: "Spreadsheet AI",
            description:
              "I can help you analyze, visualize, and modify your product revenue data.",
          }}
          conversationStarters={{
            variant: "long",
            options: [
              {
                displayText: "Chart revenue by quarter",
                prompt:
                  "Show me a bar chart comparing Q1 through Q4 revenue for all products.",
              },
              {
                displayText: "Add Vision Pro to the lineup",
                prompt:
                  "Add a new product 'Vision Pro' in category 'Headsets' with Q1=8200, Q2=11500, Q3=14800, Q4=22000, Units Sold=450, Unit Price=3499, and a SUM formula for Annual Revenue.",
              },
              {
                displayText: "Add a profit margin column",
                prompt:
                  "Add a new column called 'Profit Margin' that calculates 35% of the Annual Revenue for each product.",
              },
              {
                displayText: "Revenue breakdown by category",
                prompt:
                  "Show me a pie chart of total annual revenue broken down by category (Laptops, Phones, Audio, etc.).",
              },
              {
                displayText: "Compare Q1 vs Q4 growth",
                prompt:
                  "Show me a table comparing Q1 and Q4 revenue for each product with the percentage growth.",
              },
            ],
          }}
        />
      </div>
    </div>
  );
}

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
          <button
            onClick={() => setChatOpen(true)}
            className="chat-fab"
            aria-label="Open chat"
          >
            <MessageSquare size={22} />
            <span className="chat-fab__label">AI Chat</span>
          </button>
        )}
      </div>
    </TableProvider>
  );
}
