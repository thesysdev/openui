"use client";

import { spreadsheetLibrary } from "@/lib/spreadsheet-library";
import {
  ChatProvider,
  fetchLLM,
  openAIAdapter,
  openAIMessageFormat,
  useThread,
  useThreadList,
  type Message,
} from "@openuidev/react-headless";
import {
  buildMessage,
  BuiltinActionType,
  parseMessage,
  Renderer,
  type ActionEvent,
} from "@openuidev/react-lang";
import { ThemeProvider } from "@openuidev/react-ui";
import { PanelRightClose, Send, SquarePen } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTableContext } from "./TableContext";
import { SpreadsheetSyncContext } from "./useSpreadsheetSync";

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
    prompt:
      "Show me a table comparing Q1 and Q4 revenue for each product with the percentage growth.",
  },
];

const MESSAGES_KEY = "openui-handsontable:messages";

function readSavedMessages(): Message[] {
  try {
    const saved = JSON.parse(localStorage.getItem(MESSAGES_KEY) ?? "[]");
    return Array.isArray(saved) ? (saved as Message[]) : [];
  } catch {
    return [];
  }
}

function messageText(message: Message): string {
  if (typeof message.content !== "string") return "";
  // A form submission carries the entries in a context block; show only the label.
  return message.role === "user" ? parseMessage(message.content).content : message.content;
}

/** True when a reply carries OpenUI Lang: a ```openui-lang fence or a `root =` line. */
function hasLangSyntax(content: string): boolean {
  return content.includes("```openui-lang") || /(^|\n)\s*root\s*=/.test(content);
}

function ChatBody({ onClose }: { onClose: () => void }) {
  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const processMessage = useThread((s) => s.processMessage);
  const setMessages = useThread((s) => s.setMessages);
  const threadError = useThread((s) => s.threadError);
  const switchToNewThread = useThreadList((s) => s.switchToNewThread);
  const [input, setInput] = useState("");

  // The chat saved by an earlier visit, or before the panel was closed.
  const [restored] = useState(readSavedMessages);
  const restoredIds = useMemo(() => new Set(restored.map((m) => m.id)), [restored]);
  useEffect(() => {
    if (restored.length > 0) setMessages(restored);
  }, [restored, setMessages]);
  useEffect(() => {
    if (isRunning || messages.length === 0) return;
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages, isRunning]);
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

  const startNewChat = () => {
    switchToNewThread();
    try {
      localStorage.removeItem(MESSAGES_KEY);
    } catch {}
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    send(input);
  };

  const handleAction = (event: ActionEvent) => {
    if (event.type !== BuiltinActionType.ContinueConversation || !event.humanFriendlyMessage)
      return;
    // Send a form's entries along with the click (as AgentInterface does);
    // otherwise the assistant only sees the button label.
    if (event.formState && Object.keys(event.formState).length > 0) {
      send(
        buildMessage({
          content: event.humanFriendlyMessage,
          context: [`User clicked: ${event.humanFriendlyMessage}`, event.formState],
        }),
      );
    } else {
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
        <div className="chat-panel__actions">
          {visibleMessages.length > 0 && (
            <button
              onClick={startNewChat}
              disabled={isRunning}
              className="chat-close-btn"
              aria-label="New chat"
              title="New chat"
            >
              <SquarePen size={16} />
            </button>
          )}
          <button onClick={onClose} className="chat-close-btn" aria-label="Close chat">
            <PanelRightClose size={18} />
          </button>
        </div>
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

          const isLive = isRunning && isLastAssistant;
          // Before a tool call the model often writes a plain sentence ("Let me
          // check the table…"). That isn't OpenUI Lang, so show it as text rather
          // than passing it to the Renderer, which would drop it as a parse error.
          const prose = parseMessage(text, { streaming: isLive }).content.trim();
          const isStep = message.role === "assistant" && !!message.toolCalls?.length;

          return (
            <div key={message.id} className="chat-bubble chat-bubble--assistant">
              {hasLangSyntax(prose) ? (
                <SpreadsheetSyncContext.Provider value={!restoredIds.has(message.id)}>
                  <Renderer
                    response={text}
                    library={spreadsheetLibrary}
                    isStreaming={isLive}
                    onAction={handleAction}
                  />
                </SpreadsheetSyncContext.Provider>
              ) : prose ? (
                <p className={isStep ? "chat-thinking" : "chat-text"}>{prose}</p>
              ) : (
                isLive && <span className="chat-thinking">Working…</span>
              )}
            </div>
          );
        })}
        {threadError && !isRunning && (
          <div role="alert" className="chat-bubble chat-bubble--error">
            {threadError.message}
          </div>
        )}
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
  const { tableId } = useTableContext();
  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: openAIAdapter(),
        messageFormat: openAIMessageFormat,
        // Tells the route which table this browser's tools should read and edit.
        body: { tableId },
      }),
    [tableId],
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
