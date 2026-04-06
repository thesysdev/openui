"use client";

import "@openuidev/react-ui/components.css";
import { Renderer, extractToolResult, mergeStatements } from "@openuidev/react-lang";
import type { McpClientLike } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeProvider, MarkDownRenderer } from "@openuidev/react-ui";

// ── MCP ToolProvider with tool call tracking ────────────────────────────────

type ToolCallEntry = { tool: string; status: "pending" | "done" | "error" };
type ToolCallListener = (calls: ToolCallEntry[]) => void;

let toolCallListener: ToolCallListener | null = null;
const activeCalls: ToolCallEntry[] = [];

function notifyToolCalls() {
  toolCallListener?.([...activeCalls]);
}

function wrapMcpClient(client: McpClientLike): McpClientLike {
  return {
    ...client,
    callTool: async (params, options) => {
      const entry: ToolCallEntry = { tool: params.name, status: "pending" };
      activeCalls.push(entry);
      notifyToolCalls();
      try {
        const result = await client.callTool(params, options);
        entry.status = "done";
        notifyToolCalls();
        return result;
      } catch (err) {
        entry.status = "error";
        notifyToolCalls();
        throw err;
      }
    },
  };
}

// ── Streaming SSE ───────────────────────────────────────────────────────────

type LLMToolCall = { id: string; name: string; status: "calling" | "done"; result?: string };
type LLMToolCallListener = (calls: LLMToolCall[]) => void;
let llmToolCallListener: LLMToolCallListener | null = null;
const llmActiveCalls: LLMToolCall[] = [];

function notifyLLMToolCalls() {
  llmToolCallListener?.([...llmActiveCalls]);
}

async function streamChat(
  messages: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void,
  onDone: (usage?: { prompt_tokens?: number; completion_tokens?: number }) => void,
  signal?: AbortSignal,
  onFirstChunk?: () => void,
) {
  llmActiveCalls.length = 0;
  notifyLLMToolCalls();

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    onChunk(`Error: ${err}`);
    onDone();
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastUsage: { prompt_tokens?: number; completion_tokens?: number } | undefined;
  let firstChunkFired = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") {
        for (const tc of llmActiveCalls) {
          if (tc.status === "calling") tc.status = "done";
        }
        notifyLLMToolCalls();
        onDone(lastUsage);
        return;
      }
      try {
        const chunk = JSON.parse(data);
        const tcDeltas = chunk.choices?.[0]?.delta?.tool_calls;
        if (tcDeltas) {
          for (const tc of tcDeltas) {
            if (tc.id && tc.function?.name) {
              llmActiveCalls.push({ id: tc.id, name: tc.function.name, status: "calling" });
              notifyLLMToolCalls();
            } else if (tc.function?.arguments) {
              const existing = llmActiveCalls[tc.index];
              if (existing) {
                existing.status = "done";
                try {
                  const parsed = JSON.parse(tc.function.arguments);
                  if (parsed._response) {
                    existing.result = JSON.stringify(parsed._response).slice(0, 2000);
                  }
                } catch { /* ignore parse errors */ }
                notifyLLMToolCalls();
              }
            }
          }
        }
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          if (!firstChunkFired) { firstChunkFired = true; onFirstChunk?.(); }
          onChunk(content);
        }
        if (chunk.usage) lastUsage = chunk.usage;
      } catch { /* skip */ }
    }
  }
  onDone(lastUsage);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Extract ONLY the code portions from a response (fenced blocks or pure code) */
function extractCodeOnly(response: string): string | null {
  // Extract fenced code blocks
  const fenceRegex = /```[\w-]*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  while ((match = fenceRegex.exec(response)) !== null) {
    blocks.push(match[1].trim());
  }
  if (blocks.length > 0) return blocks.join("\n");

  // Check for unclosed fence (streaming)
  const unclosedMatch = response.match(/```[\w-]*\n([\s\S]*)$/);
  if (unclosedMatch) return unclosedMatch[1].trim() || null;

  // If pure code (no fences), return as-is
  if (isPureCode(response)) return response;

  return null;
}

function extractText(response: string): string {
  // Remove fenced code blocks, keep surrounding text
  const withoutFences = response.replace(/```[\w-]*\n[\s\S]*?```/g, "").trim();
  // Also handle unclosed fences (streaming)
  const withoutUnclosed = withoutFences.replace(/```[\w-]*\n[\s\S]*$/g, "").trim();
  // If what remains looks like pure code (not conversational text), return empty
  if (withoutUnclosed && isPureCode(withoutUnclosed)) return "";
  return withoutUnclosed;
}

function responseHasCode(response: string): boolean {
  // Has fenced code blocks
  if (/```[\w-]*\n/.test(response)) return true;
  // Or looks like pure openui-lang (starts with identifier = expression pattern)
  const trimmed = response.trim();
  if (/^[a-zA-Z_$][\w$]*\s*=\s*/.test(trimmed)) return true;
  return false;
}

/** Check if response is pure code (no fences, no conversational text) */
function isPureCode(response: string): boolean {
  const trimmed = response.trim();
  // Pure code: every non-empty line matches `identifier = expression` or is a $variable declaration
  if (/```/.test(trimmed)) return false; // has fences = not pure code
  const lines = trimmed.split("\n").filter(l => l.trim());
  if (lines.length === 0) return false;
  // If most lines look like statements, it's pure code
  const stmtPattern = /^[a-zA-Z_$][\w$]*\s*=/;
  const stmtCount = lines.filter(l => stmtPattern.test(l.trim())).length;
  return stmtCount / lines.length > 0.7;
}

// ── Starters ────────────────────────────────────────────────────────────────

const STARTERS = [
  { label: "Usage Overview", prompt: "Build a usage overview dashboard with KPI cards (events, users, errors, cost) and a daily trend chart with a date range selector", icon: "📊" },
  { label: "Server Health", prompt: "Create a server monitoring dashboard that auto-refreshes every 30 seconds showing CPU, memory, latency P95 and a 24-hour trend chart", icon: "🖥️" },
  { label: "Top Endpoints", prompt: "Build a dashboard showing the top 10 API endpoints by request count alongside an error breakdown pie chart", icon: "🔥" },
  { label: "Geo & Funnel", prompt: "Create a dashboard with a geographic usage table by region and a conversion funnel bar chart", icon: "🌍" },
  { label: "Full Analytics", prompt: "Build a full analytics dashboard with usage KPIs, top endpoints, error breakdown, geo usage, funnel metrics, and A/B experiment results", icon: "📈" },
];

// ── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  text?: string;
  hasCode: boolean;
  llmTools?: LLMToolCall[];
  runtimeTools?: ToolCallEntry[];
}

// ── Component ───────────────────────────────────────────────────────────────

export default function LLMTestPage() {
  const [input, setInput] = useState("");
  const [dashboardCode, setDashboardCode] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCallEntry[]>([]);
  const [llmTools, setLlmTools] = useState<LLMToolCall[]>([]);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const responseRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [toolProvider, setToolProvider] = useState<McpClientLike | null>(null);
  const clientRef = useRef<McpClientLike | null>(null);

  // MCP setup
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
        const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
        const client = new Client({ name: "openui-dashboard", version: "1.0.0" });
        const transport = new StreamableHTTPClientTransport(new URL("/api/mcp", globalThis.location.href));
        await client.connect(transport);
        if (cancelled) { client.close?.(); return; }
        const mcpClient = client as unknown as McpClientLike;
        clientRef.current = mcpClient;
        setToolProvider(wrapMcpClient(mcpClient));
      } catch (err) {
        console.error("[mcp] Failed:", err);
      }
    })();
    return () => { cancelled = true; clientRef.current?.close?.(); };
  }, []);

  useEffect(() => {
    toolCallListener = (calls) => {
      setToolCalls([...calls]);
      // Update the latest assistant message with runtime tool calls
      setConversation((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.role !== "assistant") return prev;
        const updated = { ...last, runtimeTools: [...calls] };
        return [...prev.slice(0, -1), updated];
      });
    };
    llmToolCallListener = (calls) => setLlmTools([...calls]);
    return () => { toolCallListener = null; llmToolCallListener = null; };
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("code");
    if (p) { try { setDashboardCode(atob(p)); } catch { /* */ } }
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, [isStreaming]);
  useEffect(() => {
    if (!isStreaming || !startTime) return;
    const iv = setInterval(() => setElapsed(Date.now() - startTime), 100);
    return () => clearInterval(iv);
  }, [isStreaming, startTime]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;
      const trimmed = text.trim();
      setInput("");
      setIsStreaming(true);
      setStartTime(null);
      setElapsed(null);
      activeCalls.length = 0;
      setToolCalls([]);
      responseRef.current = "";
      setStreamingText("");
      let streamStartTime: number | null = null;

      const userMsg: ChatMessage = { role: "user", content: trimmed, hasCode: false };
      const updated = [...conversation, userMsg];
      setConversation(updated);
      const existingCode = dashboardCode;

      // Build API messages — append current dashboard state to the latest user message
      const apiMessages = updated.map((m, i) => {
        if (m.role === "assistant" && m.llmTools?.length) {
          const toolSummary = m.llmTools.map(tc => {
            const resultSnippet = tc.result ? ` → ${tc.result.slice(0, 500)}` : " → completed";
            return `[Tool: ${tc.name}${resultSnippet}]`;
          }).join("\n");
          return { role: m.role, content: `${toolSummary}\n\n${m.content}` };
        }
        // Append current dashboard state to the LAST user message
        if (m.role === "user" && i === updated.length - 1 && existingCode) {
          return {
            role: m.role,
            content: `${m.content}\n\n<current-dashboard>\n${existingCode}\n</current-dashboard>`,
          };
        }
        return { role: m.role, content: m.content };
      });
      const controller = new AbortController();
      abortRef.current = controller;

      await streamChat(
        apiMessages,
        (chunk) => {
          responseRef.current += chunk;
          const raw = responseRef.current;
          // Update streaming text in real-time
          const liveText = extractText(raw);
          setStreamingText(liveText || "");
          // During streaming: feed raw response to Renderer directly.
          // The Renderer's parser handles stripFences + dedup internally.
          // For edits: concat existing + raw so parser sees all statements.
          if (existingCode) {
            setDashboardCode(existingCode + "\n" + raw);
          } else {
            setDashboardCode(raw);
          }
        },
        () => {
          setIsStreaming(false);
          setStreamingText("");
          if (streamStartTime) setElapsed(Date.now() - streamStartTime);

          const raw = responseRef.current;
          const hasCode = responseHasCode(raw);
          const pureCode = isPureCode(raw);
          const text = pureCode ? undefined : extractText(raw) || undefined;

          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: raw,
            text,
            hasCode,
            llmTools: llmActiveCalls.length > 0 ? [...llmActiveCalls] : undefined,
            runtimeTools: activeCalls.length > 0 ? [...activeCalls] : undefined,
          };
          setConversation((prev) => [...prev, assistantMsg]);

          if (hasCode) {
            const newCode = pureCode ? raw : extractCodeOnly(raw);
            if (newCode) {
              // Use mergeStatements for clean dedup + GC instead of string concat
              const merged = existingCode ? mergeStatements(existingCode, newCode) : newCode;
              setDashboardCode(merged);
            }
          }
        },
        controller.signal,
        () => { streamStartTime = Date.now(); setStartTime(streamStartTime); },
      );
    },
    [isStreaming, conversation, dashboardCode],
  );

  const clear = () => {
    abortRef.current?.abort();
    setDashboardCode(null);
    setConversation([]);
    setIsStreaming(false);
    setStartTime(null);
    setElapsed(null);
    responseRef.current = "";
  };

  const pendingTools = toolCalls.filter((t) => t.status === "pending");
  const canSend = input.trim().length > 0 && !isStreaming;
  const hasDashboard = dashboardCode !== null;

  return (
    <div style={{ minHeight: "100vh", background: "#fafbfc", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid #e5e7eb", background: "white", padding: "12px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <h1 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>openui-lang</h1>
        <span style={{ fontSize: "12px", color: "#888" }}>Live Demo</span>
        <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
          {["Live Data", "Streaming", "Conversational"].map((label, i) => (
            <span key={label} style={{
              padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 500,
              background: ["#ecfdf5", "#eff6ff", "#fef3c7"][i],
              color: ["#059669", "#2563eb", "#d97706"][i],
            }}>{label}</span>
          ))}
        </div>
        {(hasDashboard || conversation.length > 0) && (
          <button onClick={clear} style={{
            padding: "4px 12px", border: "1px solid #d1d5db", borderRadius: "6px",
            background: "white", cursor: "pointer", fontSize: "12px", color: "#666",
          }}>Clear</button>
        )}
      </div>

      {/* Main layout */}
      <div style={{ display: "flex", height: "calc(100vh - 49px)" }}>
        {/* Left: Dashboard artifact */}
        <div style={{
          flex: hasDashboard ? "1 1 60%" : "1 1 100%",
          overflow: "auto",
          padding: "20px",
          transition: "flex 0.3s",
        }}>
          {/* Starters */}
          {conversation.length === 0 && !hasDashboard && (
            <div style={{ maxWidth: "700px", margin: "60px auto" }}>
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>⚡</div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#111" }}>Build a dashboard</div>
                <div style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>Pick a starter or type your own prompt</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                {STARTERS.map((s) => (
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
          )}

          {/* No floating tool pills — they're now in the chat panel */}

          {/* Meta + source toggle */}
          {hasDashboard && !isStreaming && (
            <div style={{ display: "flex", gap: "12px", marginBottom: "8px", fontSize: "12px", color: "#888" }}>
              {elapsed && <span>{(elapsed / 1000).toFixed(1)}s</span>}
              <button onClick={() => setShowSource(!showSource)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#2563eb", fontSize: "12px", padding: 0,
              }}>{showSource ? "Hide code" : "View code"}</button>
            </div>
          )}

          {hasDashboard && showSource && (
            <pre style={{
              background: "#1e1e2e", color: "#cdd6f4", padding: "12px", borderRadius: "8px",
              fontSize: "11px", overflow: "auto", whiteSpace: "pre-wrap", maxHeight: "250px",
              lineHeight: "1.4", marginBottom: "12px",
            }}>{dashboardCode}</pre>
          )}

          {/* Dashboard renderer */}
          {hasDashboard && (
            <div style={{
              border: "1px solid #e2e5e9", borderRadius: "12px", padding: "20px",
              background: "white", minHeight: "200px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <ThemeProvider>
                <Renderer
                  response={dashboardCode!}
                  library={openuiLibrary}
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
                    console.log("[action]", event);
                    if (event.type === "continue_conversation") {
                      const contextText = typeof event.params?.context === "string"
                        ? event.params.context
                        : "";
                      const text = contextText || event.humanFriendlyMessage || "";
                      if (text) send(text);
                    }
                  }}
                />
              </ThemeProvider>
            </div>
          )}

          {/* Streaming placeholder */}
          {isStreaming && !hasDashboard && (
            <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
              <div style={{ fontSize: "14px" }}>Generating dashboard...</div>
              {elapsed && <div style={{ fontSize: "12px", marginTop: "4px" }}>{(elapsed / 1000).toFixed(1)}s</div>}
            </div>
          )}
        </div>

        {/* Right: Conversation panel */}
        {(conversation.length > 0 || isStreaming) && (
          <div style={{
            width: "340px", minWidth: "340px", borderLeft: "1px solid #e5e7eb",
            background: "white", display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "13px", fontWeight: 600, color: "#374151" }}>
              Conversation
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
              {conversation.map((msg, i) => (
                <div key={i} style={{ marginBottom: "12px" }}>
                  {msg.role === "user" ? (
                    <div style={{
                      background: "#f0f4ff", color: "#1e40af", padding: "8px 12px",
                      borderRadius: "10px", fontSize: "13px", lineHeight: "1.4",
                      marginLeft: "40px",
                    }}>{msg.content}</div>
                  ) : (
                    <div style={{ marginRight: "20px" }}>
                      {/* LLM tool calls — shown as distinct step before text */}
                      {msg.llmTools && msg.llmTools.length > 0 && (
                        <div style={{
                          padding: "6px 10px", borderRadius: "8px", marginBottom: "6px",
                          background: "#f0f4ff", border: "1px solid #dbeafe", fontSize: "11px",
                        }}>
                          <div style={{ color: "#1d4ed8", fontWeight: 600, marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>🔍</span> Queried data
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                            {msg.llmTools.map((tc, j) => (
                              <span key={j} style={{
                                padding: "1px 6px", borderRadius: "4px",
                                background: tc.status === "done" ? "#dbeafe" : "#e0e7ff",
                                color: "#1e40af", fontSize: "10px",
                              }}>✓ {tc.name}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Text response — rendered as markdown */}
                      {msg.text && (
                        <div style={{
                          background: "#f9fafb", border: "1px solid #e5e7eb",
                          padding: "8px 12px", borderRadius: "10px", fontSize: "13px",
                          lineHeight: "1.5", color: "#374151",
                        }}>
                          <MarkDownRenderer textMarkdown={msg.text} />
                        </div>
                      )}
                      {/* Dashboard updated badge */}
                      {msg.hasCode && (
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "2px 8px", borderRadius: "8px", fontSize: "11px",
                          background: "#ecfdf5", color: "#059669", marginTop: msg.text ? "4px" : "0",
                        }}>✓ dashboard updated</div>
                      )}
                      {/* Runtime tool calls — live data fetched */}
                      {msg.runtimeTools && msg.runtimeTools.length > 0 && (
                        <div style={{
                          marginTop: "6px", padding: "6px 10px", borderRadius: "8px",
                          background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "11px",
                        }}>
                          <div style={{ color: "#15803d", fontWeight: 600, marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>⚡</span> Live data fetched
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                            {msg.runtimeTools.map((tc, j) => (
                              <span key={j} style={{
                                padding: "1px 6px", borderRadius: "4px",
                                background: tc.status === "done" ? "#dcfce7" : tc.status === "error" ? "#fef2f2" : "#fef3c7",
                                color: tc.status === "done" ? "#166534" : tc.status === "error" ? "#991b1b" : "#92400e",
                                fontSize: "10px",
                              }}>{tc.status === "done" ? "✓" : tc.status === "error" ? "✗" : "⏳"} {tc.tool}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Empty response indicator */}
                      {!msg.text && !msg.hasCode && !msg.llmTools?.length && (
                        <div style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>
                          (empty response)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {/* Streaming indicator */}
              {isStreaming && (
                <div style={{ marginBottom: "12px", marginRight: "20px" }}>
                  {/* Show live LLM tool calls while streaming */}
                  {llmTools.length > 0 && llmTools.some(t => t.status === "calling") && (
                    <div style={{
                      fontSize: "11px", color: "#1d4ed8", marginBottom: "4px",
                      display: "flex", alignItems: "center", gap: "4px",
                    }}>
                      <span>🔍</span>
                      <span>Querying {llmTools.filter(t => t.status === "calling").length} tool{llmTools.filter(t => t.status === "calling").length > 1 ? "s" : ""}...</span>
                    </div>
                  )}
                  {/* Live streaming text */}
                  {streamingText ? (
                    <div style={{
                      background: "#f9fafb", border: "1px solid #e5e7eb",
                      padding: "8px 12px", borderRadius: "10px", fontSize: "13px",
                      lineHeight: "1.5", color: "#374151",
                    }}>
                      <MarkDownRenderer textMarkdown={streamingText} />
                    </div>
                  ) : (
                    <div style={{
                      background: "#f9fafb", border: "1px solid #e5e7eb",
                      padding: "8px 12px", borderRadius: "10px", fontSize: "13px", color: "#059669",
                    }}>
                      {llmTools.length > 0 && llmTools.some(t => t.status === "calling")
                        ? "fetching data before generating..."
                        : elapsed
                          ? `${(elapsed / 1000).toFixed(1)}s — ${responseHasCode(responseRef.current) ? "writing code..." : "thinking..."}`
                          : "thinking..."}
                    </div>
                  )}
                  {/* Dashboard update indicator during streaming */}
                  {responseHasCode(responseRef.current) && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      padding: "2px 8px", borderRadius: "8px", fontSize: "11px",
                      background: "#ecfdf5", color: "#059669", marginTop: "4px",
                    }}>⟳ updating dashboard...</div>
                  )}
                  {/* Live runtime tool calls during streaming */}
                  {toolCalls.length > 0 && (
                    <div style={{
                      marginTop: "4px", padding: "4px 8px", borderRadius: "6px",
                      background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "10px",
                    }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", alignItems: "center" }}>
                        <span style={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {pendingTools.length > 0 ? "Fetching" : "Loaded"}
                        </span>
                        {toolCalls.map((tc, j) => (
                          <span key={j} style={{
                            padding: "1px 5px", borderRadius: "3px",
                            background: tc.status === "pending" ? "#fef3c7" : tc.status === "done" ? "#ecfdf5" : "#fef2f2",
                            color: tc.status === "pending" ? "#92400e" : tc.status === "done" ? "#065f46" : "#991b1b",
                          }}>{tc.status === "pending" ? "⏳" : "✓"} {tc.tool}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input at bottom of conversation panel */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && canSend) send(input); }}
                  placeholder={hasDashboard ? "Ask or edit..." : "Describe a dashboard..."}
                  disabled={isStreaming}
                  style={{
                    flex: 1, padding: "8px 12px", border: "1px solid #d1d5db",
                    borderRadius: "8px", fontSize: "13px", outline: "none",
                  }}
                />
                <button
                  onClick={() => canSend && send(input)}
                  disabled={!canSend}
                  style={{
                    padding: "8px 16px", border: "none", borderRadius: "8px",
                    background: canSend ? "#111" : "#d1d5db", color: "white",
                    cursor: canSend ? "pointer" : "not-allowed", fontSize: "13px", fontWeight: 600,
                  }}
                >{isStreaming ? "..." : "Send"}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar when no conversation yet (centered) */}
      {conversation.length === 0 && !isStreaming && !hasDashboard && (
        <div style={{
          position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          width: "min(600px, calc(100% - 48px))",
        }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && canSend) send(input); }}
              placeholder="Describe a dashboard..."
              style={{
                flex: 1, padding: "14px 18px", border: "1px solid #d1d5db",
                borderRadius: "12px", fontSize: "14px", outline: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            />
            <button
              onClick={() => canSend && send(input)}
              disabled={!canSend}
              style={{
                padding: "14px 24px", border: "none", borderRadius: "12px",
                background: canSend ? "#111" : "#d1d5db", color: "white",
                cursor: canSend ? "pointer" : "not-allowed", fontSize: "14px", fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
