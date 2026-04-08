import { Field } from "@ark-ui/solid/field";
import {
  BuiltinActionType,
  createParser,
  Renderer,
  type ActionEvent,
  type ParseResult,
} from "@openuidev/solid-lang";
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { library } from "./lib/library";

type UserMessage = { role: "user"; text: string };
type AssistantMessage = {
  role: "assistant";
  raw: string;
  response: string;
  thinking: string;
  reasoning: string;
  thinkOpen: boolean;
  sawThinkTag: boolean;
  streaming: boolean;
  started: boolean;
};
type ChatMessage = UserMessage | AssistantMessage;

const parser = createParser(library.toJSONSchema());

export default function App() {
  const [messages, setMessages] = createSignal<ChatMessage[]>([]);
  const [input, setInput] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [showRawPanel, setShowRawPanel] = createSignal(false);
  const [rawTab, setRawTab] = createSignal<"raw" | "parsed" | "thinking">("raw");
  const [isCompact, setIsCompact] = createSignal(false);
  let rawPaneRef: HTMLDivElement | undefined;
  let previewPaneRef: HTMLDivElement | undefined;

  const promptStarters = [
    "Weather dashboard for Bandung",
    "Pricing comparison cards for 4 plans",
    "Kanban board for launch tasks",
    "Login form with validation hints",
    "Customer support operations view",
  ];

  onMount(() => {
    const onResize = () => setIsCompact(window.innerWidth < 980);
    onResize();
    window.addEventListener("resize", onResize);
    onCleanup(() => window.removeEventListener("resize", onResize));
  });

  const latestAssistant = createMemo<AssistantMessage | undefined>(() => {
    const list = messages();
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const msg = list[i];
      if (msg?.role === "assistant") return msg;
    }
    return undefined;
  });

  const parsedResult = createMemo<ParseResult | null>(() => {
    const assistant = latestAssistant();
    if (!assistant?.response) return null;
    try {
      return parser.parse(assistant.response);
    } catch {
      return null;
    }
  });

  createEffect(() => {
    const assistant = latestAssistant();
    if (!assistant || !assistant.streaming) return;
    requestAnimationFrame(() => {
      if (rawPaneRef) rawPaneRef.scrollTo({ top: rawPaneRef.scrollHeight });
      if (previewPaneRef) previewPaneRef.scrollTo({ top: previewPaneRef.scrollHeight });
    });
  });

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading()) return;

    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        raw: "",
        response: "",
        thinking: "",
        reasoning: "",
        thinkOpen: false,
        sawThinkTag: false,
        streaming: true,
        started: false,
      },
    ]);

    const rootAssignRegex = /\broot\s*=\s*[A-Za-z_][A-Za-z0-9_]*\s*\(/;
    const openUiStartRegex = /[A-Za-z_][A-Za-z0-9_]*\s*=\s*[A-Za-z_][A-Za-z0-9_]*\s*\(/;

    const sanitizeModelText = (value: string) =>
      value
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<\/?think>/gi, "")
        .replace(/```openui-lang/gi, "")
        .replace(/```/g, "");

    const joinThinking = (reasoning: string, prelude: string) =>
      [reasoning.trim(), prelude.trim()].filter((part) => part.length > 0).join("\n\n");

    const extractLiveThinkFromRaw = (rawText: string) => {
      const openTag = "<think>";
      const closeTag = "</think>";
      const lastOpen = rawText.lastIndexOf(openTag);
      const lastClose = rawText.lastIndexOf(closeTag);
      if (lastOpen < 0 || lastOpen < lastClose) return { thinkOpen: false, thinking: "" };
      const thinking = rawText.slice(lastOpen + openTag.length).trim();
      return { thinkOpen: true, thinking };
    };

    const extractOpenUi = (rawText: string) => {
      const sanitizedRaw = sanitizeModelText(rawText);
      const rootIndex = sanitizedRaw.search(rootAssignRegex);
      const anyAssignIndex = sanitizedRaw.search(openUiStartRegex);
      const startIndex =
        anyAssignIndex >= 0 && rootIndex >= 0
          ? Math.min(anyAssignIndex, rootIndex)
          : anyAssignIndex >= 0
            ? anyAssignIndex
            : rootIndex;
      const prelude = startIndex >= 0 ? sanitizedRaw.slice(0, startIndex) : sanitizedRaw;
      const response = startIndex >= 0 ? sanitizedRaw.slice(startIndex) : "";
      return { prelude, response, started: response.trim().length > 0 };
    };

    const appendAssistantDelta = (delta: string) => {
      if (!delta) return;
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          const msg = next[i];
          if (msg?.role === "assistant" && msg.streaming) {
            const raw = msg.raw + delta;
            const extracted = extractOpenUi(raw);
            const sawThinkTag =
              msg.sawThinkTag || raw.includes("<think>") || raw.includes("</think>");
            const liveThink = extractLiveThinkFromRaw(raw);
            const thinking = sawThinkTag
              ? liveThink.thinkOpen
                ? liveThink.thinking
                : ""
              : joinThinking(msg.reasoning, extracted.prelude);
            next[i] = {
              ...msg,
              raw,
              response: extracted.response,
              thinking,
              thinkOpen: sawThinkTag ? liveThink.thinkOpen : msg.reasoning.trim().length > 0,
              sawThinkTag,
              started: msg.started || extracted.started,
            };
            break;
          }
        }
        return next;
      });
    };

    const appendThinkingDelta = (delta: string) => {
      if (!delta) return;
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          const msg = next[i];
          if (msg?.role === "assistant" && msg.streaming) {
            const reasoning = msg.reasoning + delta;
            const extracted = extractOpenUi(msg.raw || "");
            const currentRaw = msg.raw || "";
            const sawThinkTag =
              msg.sawThinkTag || currentRaw.includes("<think>") || currentRaw.includes("</think>");
            const liveThink = extractLiveThinkFromRaw(currentRaw);
            const thinking = sawThinkTag
              ? liveThink.thinkOpen
                ? liveThink.thinking
                : ""
              : joinThinking(reasoning, extracted.prelude);
            next[i] = {
              ...msg,
              reasoning,
              thinking,
              thinkOpen: sawThinkTag ? liveThink.thinkOpen : reasoning.trim().length > 0,
              sawThinkTag,
            };
            break;
          }
        }
        return next;
      });
    };

    const finishAssistantStream = (fallbackError?: string) => {
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          const msg = next[i];
          if (msg?.role === "assistant" && msg.streaming) {
            const extracted = extractOpenUi(msg.response || msg.raw || "");
            const cleaned = extracted.response.trim();
            const response =
              cleaned ||
              `t1 = TextContent("Error: ${(fallbackError || "Empty response").replaceAll('"', '\\"')}")\ncard = Card("LLM Stream Error", [t1])\nroot = Stack([card])`;
            next[i] = {
              ...msg,
              response,
              streaming: false,
              thinking: "",
              thinkOpen: false,
              started: msg.started || cleaned.length > 0,
            };
            break;
          }
        }
        return next;
      });
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok || !response.body) {
        finishAssistantStream(`HTTP ${response.status} from chat API`);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith("data:")) continue;
            const payload = trimmedLine.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload) as { delta?: string; thinkingDelta?: string };
              if (parsed.delta) appendAssistantDelta(parsed.delta);
              if (parsed.thinkingDelta) appendThinkingDelta(parsed.thinkingDelta);
            } catch {
              appendAssistantDelta(payload);
            }
          }
        }
      }

      finishAssistantStream();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error";
      finishAssistantStream(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAction(event: ActionEvent) {
    if (event.type === BuiltinActionType.ContinueConversation && event.humanFriendlyMessage) {
      void sendMessage(event.humanFriendlyMessage);
    }
  }

  const panelColumns = () => {
    if (isCompact()) return "minmax(0, 1fr)";
    if (!showRawPanel()) return "minmax(0, 1fr)";
    return "minmax(320px, 0.95fr) minmax(0, 1.4fr)";
  };

  const paneHeight = () => {
    if (isCompact()) return "56vh";
    return "520px";
  };

  const statusLabel = createMemo(() => {
    const assistant = latestAssistant();
    if (!assistant) return "Ready";
    if (assistant.streaming && !assistant.started) return "Streaming";
    if (assistant.streaming && assistant.started) return "Rendering";
    return "Ready";
  });

  const statusColor = createMemo(() => {
    if (statusLabel() === "Streaming" || statusLabel() === "Rendering") return "#2563eb";
    return "#16a34a";
  });

  return (
    <div
      style={{
        margin: "0 auto",
        padding: "24px 18px",
        "max-width": "1280px",
        "font-family": "Avenir Next, Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          margin: "0 0 14px",
          padding: "22px 16px 12px",
          border: "1px solid rgba(148,163,184,0.28)",
          "border-radius": "16px",
          background: "linear-gradient(130deg, #f8fafc 0%, #eef2ff 52%, #f0f9ff 100%)",
          "box-shadow": "0 10px 26px rgba(15, 23, 42, 0.08)",
        }}
      >
        <h1
          style={{
            margin: "0 0 16px",
            "font-size": "42px",
            color: "#0f172a",
            "text-align": "center",
          }}
        >
          What do you want to build?
        </h1>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input());
          }}
          style={{
            display: "grid",
            gap: "10px",
            padding: "12px",
            margin: "0 auto",
            "max-width": "760px",
            border: "1px solid rgba(148,163,184,0.28)",
            "border-radius": "14px",
            background: "#ffffff",
          }}
        >
          <Field.Root style={{ width: "100%" }}>
            <Field.Input
              value={input()}
              onInput={(event: InputEvent & { currentTarget: HTMLInputElement }) =>
                setInput(event.currentTarget.value)
              }
              placeholder="Describe the UI you want to generate..."
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #dbe2ea",
                "border-radius": "10px",
                background: "#ffffff",
                "box-sizing": "border-box",
              }}
            />
          </Field.Root>

          <div
            style={{
              display: "flex",
              gap: "10px",
              "justify-content": "space-between",
              "flex-wrap": "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setShowRawPanel((value) => !value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#0f172a",
                "border-radius": "10px",
                cursor: "pointer",
              }}
            >
              {showRawPanel() ? "Hide Output Panel" : "Show Output Panel"}
            </button>

            <button
              type="submit"
              disabled={isLoading()}
              style={{
                padding: "10px 14px",
                border: "1px solid #0f172a",
                background: "#0f172a",
                color: "#ffffff",
                "border-radius": "10px",
                cursor: "pointer",
                opacity: isLoading() ? 0.6 : 1,
              }}
            >
              {isLoading() ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>

        <div
          style={{
            display: "flex",
            gap: "8px",
            "justify-content": "center",
            "flex-wrap": "wrap",
            margin: "12px 0 0",
          }}
        >
          <For each={promptStarters}>
            {(starter) => (
              <button
                type="button"
                onClick={() => setInput(starter)}
                style={{
                  padding: "7px 12px",
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "rgba(248,250,252,0.9)",
                  color: "#334155",
                  "border-radius": "999px",
                  "font-size": "12px",
                  cursor: "pointer",
                }}
              >
                {starter}
              </button>
            )}
          </For>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "12px",
          "grid-template-columns": panelColumns(),
          margin: "0 auto",
          "max-width": "1240px",
          border: "1px solid rgba(148,163,184,0.28)",
          "border-radius": "14px",
          background: "#f8fafc",
          padding: "12px",
        }}
      >
        <Show when={showRawPanel()}>
          <section
            style={{
              background: "#020617",
              color: "#e2e8f0",
              border: "1px solid rgba(30,41,59,0.9)",
              "border-radius": "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "8px",
                border: "1px solid rgba(51,65,85,0.75)",
                "border-left": "0",
                "border-right": "0",
                "border-top": "0",
              }}
            >
              <button
                type="button"
                onClick={() => setRawTab("raw")}
                style={rawTabStyle(rawTab() === "raw")}
              >
                RAW OUTPUT
              </button>
              <button
                type="button"
                onClick={() => setRawTab("parsed")}
                style={rawTabStyle(rawTab() === "parsed")}
              >
                PARSED JSON
              </button>
              <button
                type="button"
                onClick={() => setRawTab("thinking")}
                style={rawTabStyle(rawTab() === "thinking")}
              >
                THINKING
              </button>
            </div>

            <div
              ref={rawPaneRef}
              style={{
                height: paneHeight(),
                overflow: "auto",
                padding: "14px",
                "scrollbar-width": "thin",
              }}
            >
              <Show
                when={latestAssistant()}
                fallback={
                  <div style={{ color: "#64748b" }}>Generated output will appear here.</div>
                }
              >
                {(assistant) => (
                  <pre
                    style={{
                      margin: 0,
                      "font-size": "12.5px",
                      "line-height": 1.55,
                      "white-space": "pre-wrap",
                      "word-break": "break-word",
                      color: "#e2e8f0",
                      "font-family":
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    }}
                  >
                    {rawTab() === "raw"
                      ? assistant().raw || "Waiting for model stream..."
                      : rawTab() === "thinking"
                        ? assistant().thinkOpen
                          ? assistant().thinking || "Thinking..."
                          : "No active thinking stream."
                        : parsedResult()
                          ? JSON.stringify(parsedResult(), null, 2)
                          : "Parser has no stable result yet."}
                  </pre>
                )}
              </Show>
            </div>
          </section>
        </Show>

        <section
          style={{
            border: "1px solid rgba(148,163,184,0.28)",
            "border-radius": "12px",
            background: "#ffffff",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              "justify-content": "space-between",
              "align-items": "center",
              padding: "10px 12px",
              border: "1px solid rgba(148,163,184,0.2)",
              "border-left": "0",
              "border-right": "0",
              "border-top": "0",
              "font-size": "12px",
              "font-weight": 700,
              color: "#64748b",
              "letter-spacing": "0.04em",
            }}
          >
            <span>PREVIEW</span>
            <span
              style={{
                color: statusColor(),
                "font-weight": 600,
                "letter-spacing": "normal",
                "font-size": "12px",
              }}
            >
              {statusLabel()}
            </span>
          </div>

          <div
            ref={previewPaneRef}
            style={{
              height: paneHeight(),
              overflow: "auto",
              padding: "14px",
              "scrollbar-width": "thin",
              background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            }}
          >
            <Show
              when={latestAssistant()}
              fallback={<div style={{ color: "#94a3b8" }}>Rendered UI will appear here.</div>}
            >
              {(assistant) => (
                <Show
                  when={assistant().response.trim().length > 0 || !assistant().streaming}
                  fallback={
                    <div style={{ display: "grid", gap: "10px" }}>
                      <div
                        style={{
                          height: "18px",
                          width: "180px",
                          "border-radius": "8px",
                          background:
                            "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)",
                          "background-size": "220% 100%",
                          animation: "skeleton 1.4s ease infinite",
                        }}
                      />
                      <div
                        style={{
                          height: "130px",
                          width: "100%",
                          "border-radius": "12px",
                          background:
                            "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)",
                          "background-size": "220% 100%",
                          animation: "skeleton 1.4s ease infinite",
                        }}
                      />
                      <div style={{ color: "#64748b", "font-size": "13px" }}>Generating UI...</div>
                    </div>
                  }
                >
                  <Show when={assistant().thinkOpen && assistant().thinking.trim().length > 0}>
                    <details
                      style={{
                        margin: "0 0 10px",
                        border: "1px solid rgba(148,163,184,0.28)",
                        "border-radius": "10px",
                        background: "rgba(255,255,255,0.72)",
                        padding: "8px 10px",
                      }}
                    >
                      <summary
                        style={{
                          cursor: "pointer",
                          display: "inline-flex",
                          gap: "8px",
                          "align-items": "center",
                          color: "#334155",
                          "font-size": "12px",
                          "font-weight": 600,
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            "border-radius": "999px",
                            background: "#0ea5e9",
                            animation: "pulse 1.1s ease-in-out infinite",
                          }}
                        />
                        Thinking
                      </summary>
                      <pre
                        style={{
                          margin: "8px 0 0",
                          "font-size": "12px",
                          color: "#475569",
                          "white-space": "pre-wrap",
                          "word-break": "break-word",
                          "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
                        }}
                      >
                        {assistant().thinking}
                      </pre>
                    </details>
                  </Show>
                  <Renderer
                    response={assistant().response}
                    library={library}
                    isStreaming={assistant().streaming}
                    onAction={handleAction}
                  />
                </Show>
              )}
            </Show>
          </div>
        </section>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.35; transform: scale(0.9);} 50% { opacity: 1; transform: scale(1);} } @keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -20% 0; } }`}</style>
    </div>
  );
}

function rawTabStyle(isActive: boolean) {
  return {
    padding: "5px 10px",
    "font-size": "11px",
    "font-weight": 700,
    "letter-spacing": "0.04em",
    border: isActive ? "1px solid #334155" : "1px solid transparent",
    background: isActive ? "rgba(51,65,85,0.6)" : "transparent",
    color: isActive ? "#f8fafc" : "#64748b",
    "border-radius": "8px",
    cursor: "pointer",
  } as const;
}
