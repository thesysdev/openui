"use client";

import { spreadsheetLibrary } from "@/lib/spreadsheet-library";
import {
  ChatProvider,
  fetchLLM,
  openAIAdapter,
  openAIMessageFormat,
  useThread,
  type Message,
} from "@openuidev/react-headless";
import { BuiltinActionType, Renderer, type ActionEvent } from "@openuidev/react-lang";
import { ThemeProvider } from "@openuidev/react-ui";
import { PanelRightClose, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STARTERS = [
  {
    displayText: "Chart revenue by quarter",
    prompt: "Show me a bar chart comparing Q1 through Q4 revenue for all products.",
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
    prompt: "Show me a table comparing Q1 and Q4 revenue for each product with the percentage growth.",
  },
];

function messageText(message: Message): string {
  return typeof message.content === "string" ? message.content : "";
}

function ChatBody({ onClose }: { onClose: () => void }) {
  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const processMessage = useThread((s) => s.processMessage);
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role === "user" || m.role === "assistant"),
    [messages],
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isRunning) return;
      void processMessage({ role: "user", content: trimmed });
      setInput("");
    },
    [isRunning, processMessage],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    send(input);
  };

  const handleAction = (event: ActionEvent) => {
    if (event.type === BuiltinActionType.ContinueConversation && event.humanFriendlyMessage) {
      send(event.humanFriendlyMessage);
    }
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleMessages, isRunning]);

  return (
    <>
      <div className="chat-panel__header">
        <div>
          <div className="chat-panel__title">Spreadsheet AI</div>
          <div className="chat-panel__subtitle">Analyze, chart, or edit the grid</div>
        </div>
        <button onClick={onClose} className="chat-close-btn" aria-label="Close chat">
          <PanelRightClose size={18} />
        </button>
      </div>

      <div ref={scrollerRef} className="chat-messages">
        {visibleMessages.length === 0 && (
          <div className="chat-empty">
            <p>I can help you analyze, visualize, and modify your product revenue data.</p>
            <div className="chat-starters">
              {STARTERS.map((starter) => (
                <button
                  key={starter.displayText}
                  type="button"
                  className="chat-starter"
                  disabled={isRunning}
                  onClick={() => send(starter.prompt)}
                >
                  {starter.displayText}
                </button>
              ))}
            </div>
          </div>
        )}

        {visibleMessages.map((message, index) => {
          const text = messageText(message);
          const isLastAssistant =
            message.role === "assistant" && index === visibleMessages.length - 1;

          if (message.role === "user") {
            return (
              <div key={message.id} className="chat-bubble chat-bubble--user">
                {text}
              </div>
            );
          }

          return (
            <div key={message.id} className="chat-bubble chat-bubble--assistant">
              {text ? (
                <Renderer
                  response={text}
                  library={spreadsheetLibrary}
                  isStreaming={isRunning && isLastAssistant}
                  onAction={handleAction}
                />
              ) : (
                isRunning && isLastAssistant && <span className="chat-thinking">Working…</span>
              )}
            </div>
          );
        })}
      </div>

      <form className="chat-composer" onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask about the spreadsheet…"
          disabled={isRunning}
          rows={2}
        />
        <button type="submit" disabled={isRunning || !input.trim()} aria-label="Send">
          <Send size={16} />
        </button>
      </form>
    </>
  );
}

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: openAIAdapter(),
        messageFormat: openAIMessageFormat,
      }),
    [],
  );

  return (
    <ThemeProvider mode="dark" cssSelector=".chat-panel">
      <div className="chat-panel">
        <ChatProvider llm={llm}>
          <ChatBody onClose={onClose} />
        </ChatProvider>
      </div>
    </ThemeProvider>
  );
}
