"use client";

import { mergeStatements } from "@openuidev/react-lang";
import { Code2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConversationPanel } from "./components/ConversationPanel/ConversationPanel";
import { GitHubConnect } from "./components/GitHubConnect/GitHubConnect";
import { Header } from "./components/Header/Header";
import { PreviewPanel } from "./components/PreviewPanel/PreviewPanel";
import {
  GITHUB_STARTERS,
  type ChatMessage,
  type Model,
  type Status,
  type Theme,
  type ToolCallEntry,
} from "./constants";
import { clearCache, createGitHubToolProvider } from "./github/tools";

// ── Helpers (from dashboard example) ─────────────────────────────────────

function extractCodeOnly(response: string): string | null {
  const fenceRegex = /```[\w-]*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  while ((match = fenceRegex.exec(response)) !== null) {
    blocks.push(match[1].trim());
  }
  if (blocks.length > 0) return blocks.join("\n");

  const unclosedMatch = response.match(/```[\w-]*\n([\s\S]*)$/);
  if (unclosedMatch) return unclosedMatch[1].trim() || null;

  if (isPureCode(response)) return response;
  return null;
}

function extractText(response: string): string {
  const withoutFences = response.replace(/```[\w-]*\n[\s\S]*?```/g, "").trim();
  const withoutUnclosed = withoutFences.replace(/```[\w-]*\n[\s\S]*$/g, "").trim();
  if (withoutUnclosed && isPureCode(withoutUnclosed)) return "";
  return withoutUnclosed;
}

function responseHasCode(response: string): boolean {
  if (/```[\w-]*\n/.test(response)) return true;
  const trimmed = response.trim();
  if (/^[a-zA-Z_$][\w$]*\s*=\s*/.test(trimmed)) return true;
  return false;
}

function isPureCode(response: string): boolean {
  const trimmed = response.trim();
  if (/```/.test(trimmed)) return false;
  const lines = trimmed.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return false;
  const stmtPattern = /^[a-zA-Z_$][\w$]*\s*=/;
  const stmtCount = lines.filter((l) => stmtPattern.test(l.trim())).length;
  return stmtCount / lines.length > 0.7;
}

// ── Tool call tracking wrapper ───────────────────────────────────────────

type ToolCallListener = (calls: ToolCallEntry[]) => void;

function wrapToolProvider(
  inner: Record<string, (args: Record<string, unknown>) => Promise<unknown>>,
  listener: ToolCallListener,
): Record<string, (args: Record<string, unknown>) => Promise<unknown>> {
  const activeCalls: ToolCallEntry[] = [];
  const wrapped: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {};

  for (const [name, fn] of Object.entries(inner)) {
    wrapped[name] = async (args) => {
      const entry: ToolCallEntry = { tool: name, status: "pending" };
      activeCalls.push(entry);
      listener([...activeCalls]);
      try {
        const data = await fn(args);
        entry.status = "done";
        listener([...activeCalls]);
        return data;
      } catch {
        entry.status = "error";
        listener([...activeCalls]);
        return null;
      }
    };
  }

  return wrapped;
}

// ── SSE streaming ────────────────────────────────────────────────────────

async function streamChat(
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  onDone: () => void,
  signal?: AbortSignal,
  onFirstChunk?: () => void,
) {
  const res = await fetch("/api/playground/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    onChunk(
      `Error: ${(err as { error?: { message?: string } }).error?.message ?? `Server error ${res.status}`}`,
    );
    onDone();
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let firstChunkFired = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const raw = decoder.decode(value, { stream: true });
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") {
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(data) as {
          choices: Array<{ delta: { content?: string } }>;
        };
        const content = parsed.choices[0]?.delta?.content;
        if (content) {
          if (!firstChunkFired) {
            firstChunkFired = true;
            onFirstChunk?.();
          }
          onChunk(content);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }
  onDone();
}

// ── Main Page ────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  // Theme / model
  const [theme, setTheme] = useState<Theme>("system");
  const [model, setModel] = useState<Model>("openai/gpt-5.4-mini");

  // GitHub connection
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [toolProvider, setToolProvider] = useState<Record<
    string,
    (args: Record<string, unknown>) => Promise<unknown>
  > | null>(null);

  // Dashboard state
  const [dashboardCode, setDashboardCode] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [parsedJson, setParsedJson] = useState<string | null>(null);

  // Conversation
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [toolCalls, setToolCalls] = useState<ToolCallEntry[]>([]);

  // Streaming
  const [status, setStatus] = useState<Status>("idle");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Prompt (for generic mode)
  const [prompt, setPrompt] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const responseRef = useRef("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Track pending auto-send from GitHub connect + starter combo
  const pendingPromptRef = useRef<string | null>(null);

  const isStreaming = status === "streaming";
  const hasDashboard = dashboardCode !== null;
  const isGitHub = githubUsername !== null;

  // Theme
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "system") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", theme);
  }, [theme]);

  const cycleTheme = () =>
    setTheme((t) => (t === "system" ? "light" : t === "light" ? "dark" : "system"));

  // Timer
  useEffect(() => {
    if (!isStreaming || !startTime) return;
    const iv = setInterval(() => setElapsed(Date.now() - startTime), 100);
    return () => clearInterval(iv);
  }, [isStreaming, startTime]);

  // ── GitHub connect ───────────────────────────────────────────────────

  const handleConnect = useCallback((username: string) => {
    const rawTools = createGitHubToolProvider(username);
    const wrapped = wrapToolProvider(rawTools, (calls) => {
      setToolCalls([...calls]);
      // Update latest assistant message with tool calls
      setConversation((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.role !== "assistant") return prev;
        return [...prev.slice(0, -1), { ...last, runtimeTools: [...calls] }];
      });
    });
    setGithubUsername(username);
    setToolProvider(wrapped);
  }, []);

  const handleDisconnect = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearCache();
    setGithubUsername(null);
    setToolProvider(null);
    setDashboardCode(null);
    setConversation([]);
    setStatus("idle");
    setStreamingText("");
    setToolCalls([]);
    setElapsed(null);
    setPrompt("");
    setShowSource(false);
    setParsedJson(null);
    setErrorMsg("");
  };

  // ── Send message ─────────────────────────────────────────────────────

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;
      const trimmed = text.trim();

      setStatus("streaming");
      setStartTime(null);
      setElapsed(null);
      setErrorMsg("");
      responseRef.current = "";
      setStreamingText("");
      setToolCalls([]);
      let streamStartTime: number | null = null;

      const userMsg: ChatMessage = {
        role: "user",
        content: trimmed,
        hasCode: false,
      };
      const updated = [...conversation, userMsg];
      setConversation(updated);
      const existingCode = dashboardCode;

      // Build API messages
      const apiMessages = updated.map((m, i) => {
        // Append current dashboard state to last user message
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

      try {
        await streamChat(
          {
            model,
            prompt: trimmed,
            dataSource: isGitHub ? "github" : undefined,
            messages: apiMessages.slice(0, -1), // all but last (prompt is separate)
          },
          (chunk) => {
            responseRef.current += chunk;
            const raw = responseRef.current;
            setStreamingText(extractText(raw) || "");
            // Live preview — feed to Renderer during streaming
            if (existingCode) {
              setDashboardCode(existingCode + "\n" + raw);
            } else {
              setDashboardCode(raw);
            }
          },
          () => {
            setStatus("done");
            abortRef.current = null;
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
              runtimeTools: toolCalls.length > 0 ? [...toolCalls] : undefined,
            };
            setConversation((prev) => [...prev, assistantMsg]);

            if (hasCode) {
              const newCode = pureCode ? raw : extractCodeOnly(raw);
              if (newCode) {
                const merged = existingCode ? mergeStatements(existingCode, newCode) : newCode;
                setDashboardCode(merged);
              }
            }
          },
          controller.signal,
          () => {
            streamStartTime = Date.now();
            setStartTime(streamStartTime);
          },
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          setStatus("idle");
          return;
        }
        setErrorMsg(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    },
    [isStreaming, conversation, dashboardCode, model, isGitHub],
  );

  // Process pending prompt after GitHub connect — must be after send is defined
  useEffect(() => {
    if (githubUsername && toolProvider && pendingPromptRef.current) {
      const p = pendingPromptRef.current;
      pendingPromptRef.current = null;
      send(p);
    }
  }, [githubUsername, toolProvider, send]);

  const handleStop = () => {
    abortRef.current?.abort();
    setStatus("idle");
  };

  // ── Generic mode handlers ────────────────────────────────────────────

  const handleGenericSubmit = useCallback(() => {
    if (!prompt.trim() || isStreaming) return;
    send(prompt.trim());
    setPrompt("");
  }, [prompt, isStreaming, send]);

  const handleGenericPrompt = (text: string) => {
    send(text);
  };

  const handleConnectAndPrompt = useCallback(
    (username: string, promptText: string) => {
      // Set pending prompt BEFORE connecting — the useEffect will fire it
      // once toolProvider is ready
      pendingPromptRef.current = promptText;
      handleConnect(username);
    },
    [handleConnect],
  );

  // ── Render ─────────────────────────────────────────────────────────────

  const showConversation = conversation.length > 0 || isStreaming;

  return (
    <div className="app">
      <Header
        theme={theme}
        onThemeToggle={cycleTheme}
        hasApiKey={false}
        onChangeKey={() => {}}
        githubUsername={githubUsername}
        onDisconnect={handleDisconnect}
      />

      <div className="app-body">
        {/* Phase 1: Connect Screen (no GitHub username) */}
        {!isGitHub && !hasDashboard && conversation.length === 0 && (
          <div className="content-wrapper">
            <GitHubConnect
              onConnect={handleConnect}
              onConnectAndPrompt={handleConnectAndPrompt}
              onGenericPrompt={(p) => {
                // Generic mode — no GitHub, just send prompt
                send(p);
              }}
            />
          </div>
        )}

        {/* Phase 2: Artifact Layout (connected or generating) */}
        {(isGitHub || hasDashboard || conversation.length > 0) && (
          <div className="artifact-layout">
            {/* Left: Dashboard */}
            <div className="dashboard-area">
              {/* Connected user bar */}
              {isGitHub && (hasDashboard || conversation.length > 0) && (
                <div className="gh-connected-bar">
                  <img
                    src={`https://github.com/${githubUsername}.png?size=32`}
                    alt=""
                    className="gh-connected-avatar"
                  />
                  <span>@{githubUsername}</span>
                  <button className="gh-connected-change" onClick={handleDisconnect}>
                    Change
                  </button>
                </div>
              )}

              {/* GitHub starters (before first generation) */}
              {isGitHub && !hasDashboard && conversation.length === 0 && (
                <div className="gh-starters-welcome">
                  <div className="gh-welcome-text">
                    <span className="gh-welcome-avatar">
                      <img
                        src={`https://github.com/${githubUsername}.png?size=32`}
                        alt=""
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                        }}
                      />
                    </span>
                    Connected as <strong>@{githubUsername}</strong>. What do you want to build?
                  </div>
                  <div className="gh-starters-grid" style={{ maxWidth: 600 }}>
                    {GITHUB_STARTERS.map((s) => (
                      <button
                        key={s.prompt}
                        className="gh-starter-card"
                        onClick={() => send(s.prompt)}
                        disabled={isStreaming}
                      >
                        <span className="gh-starter-icon">{s.icon}</span>
                        <div className="gh-starter-label">{s.label}</div>
                        <div className="gh-starter-desc">
                          {s.prompt.length > 60 ? s.prompt.slice(0, 60) + "..." : s.prompt}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta + source toggle */}
              {hasDashboard && !isStreaming && (
                <div className="dashboard-meta">
                  {elapsed && (
                    <span className="dashboard-elapsed">{(elapsed / 1000).toFixed(1)}s</span>
                  )}
                  <button
                    className="dashboard-source-toggle"
                    onClick={() => setShowSource(!showSource)}
                  >
                    <Code2 size={12} />
                    {showSource ? "Hide code" : "View code"}
                  </button>
                </div>
              )}

              {/* Source code view */}
              {hasDashboard && showSource && (
                <pre className="dashboard-source">{dashboardCode}</pre>
              )}

              {/* Dashboard renderer */}
              {hasDashboard && (
                <div className="dashboard-renderer">
                  <PreviewPanel
                    code={dashboardCode!}
                    isStreaming={isStreaming}
                    onParseResult={(r) => setParsedJson(r ? JSON.stringify(r, null, 2) : null)}
                    theme={theme}
                    toolProvider={toolProvider}
                    onAction={(event) => {
                      if (event.type === "continue_conversation") {
                        const text =
                          (typeof event.params?.context === "string" ? event.params.context : "") ||
                          event.humanFriendlyMessage ||
                          "";
                        if (text) send(text);
                      }
                    }}
                  />
                </div>
              )}

              {/* Streaming placeholder (before first code arrives) */}
              {isStreaming && !hasDashboard && (
                <div className="dashboard-loading">
                  <div className="dashboard-loading-text">Generating dashboard...</div>
                  {elapsed && (
                    <div className="dashboard-loading-timer">{(elapsed / 1000).toFixed(1)}s</div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Conversation Panel */}
            {showConversation && (
              <ConversationPanel
                messages={conversation}
                streamingText={streamingText}
                isStreaming={isStreaming}
                elapsed={elapsed}
                toolCalls={toolCalls}
                onSend={send}
                onStop={handleStop}
                hasDashboard={hasDashboard}
                responseHasCode={responseHasCode(responseRef.current)}
              />
            )}
          </div>
        )}
      </div>

      {/* Error banner */}
      {status === "error" && errorMsg && <div className="error-banner">{errorMsg}</div>}
    </div>
  );
}
