"use client";

import { mergeStatements } from "@openuidev/react-lang";
import { Button } from "@openuidev/react-ui";
import { encode } from "gpt-tokenizer";
import {
  Activity,
  Check,
  CircleDot,
  Code2,
  Copy,
  GitPullRequest,
  Hexagon,
  Search,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Highlight, themes } from "prism-react-renderer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConversationPanel } from "./components/ConversationPanel/ConversationPanel";
import { GitHubConnect } from "./components/GitHubConnect/GitHubConnect";
import { Header } from "./components/Header/Header";
import { PreviewPanel } from "./components/PreviewPanel/PreviewPanel";
import {
  GITHUB_DEMO_MODEL_LABEL,
  GITHUB_STARTERS,
  type ChatMessage,
  type GitHubStarterIconKey,
  type Status,
  type Theme,
  type ToolCallEntry,
} from "./constants";
import { clearCache, createGitHubToolProvider, prefetchAndSummarize } from "./github/tools";

// ── Helpers ─────────────────────────────────────────────────────────────────

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

const STARTER_ICON_MAP: Record<GitHubStarterIconKey, LucideIcon> = {
  "commit-activity": Activity,
  "pull-requests": GitPullRequest,
  "issue-tracking": CircleDot,
  "code-reviews": Search,
  "language-breakdown": Code2,
  "repository-stats": Hexagon,
};

function renderStarterIcon(icon: GitHubStarterIconKey) {
  const Icon = STARTER_ICON_MAP[icon];
  return <Icon size={16} strokeWidth={2} />;
}

// ── Tool call tracking wrapper ───────────────────────────────────────────

type ToolCallListener = (calls: ToolCallEntry[]) => void;

function wrapToolProvider(
  inner: Record<string, (args: Record<string, unknown>) => Promise<unknown>>,
  listener: ToolCallListener,
): {
  tools: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;
  resetCalls: () => void;
} {
  let activeCalls: ToolCallEntry[] = [];
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

  return {
    tools: wrapped,
    resetCalls: () => {
      activeCalls = [];
    },
  };
}

// ── SSE streaming ────────────────────────────────────────────────────────

async function streamChat(
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  onDone: () => void,
  signal?: AbortSignal,
  onFirstChunk?: () => void,
) {
  const res = await fetch("/api/demo/github/stream", {
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

export default function GitHubDemoPage() {
  // Theme
  const { theme, setTheme, resolvedTheme } = useTheme();

  // GitHub connection
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [toolProvider, setToolProvider] = useState<Record<
    string,
    (args: Record<string, unknown>) => Promise<unknown>
  > | null>(null);

  // Dashboard state
  const [dashboardCode, setDashboardCode] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [sourceTab, setSourceTab] = useState<"raw" | "json">("raw");
  const [parsedJson, setParsedJson] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Conversation
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [toolCalls, setToolCalls] = useState<ToolCallEntry[]>([]);
  const [streamResponseHasCode, setStreamResponseHasCode] = useState(false);

  // Streaming
  const [status, setStatus] = useState<Status>("idle");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const responseRef = useRef("");
  const pendingPromptRef = useRef<string | null>(null);

  const isStreaming = status === "streaming";
  const hasDashboard = dashboardCode !== null;
  const isGitHub = githubUsername !== null;
  const isHomeState = !isGitHub && !hasDashboard && conversation.length === 0;

  // Token comparison
  const rawTokens = useMemo(
    () => (dashboardCode ? encode(dashboardCode).length : 0),
    [dashboardCode],
  );
  const jsonTokens = useMemo(() => (parsedJson ? encode(parsedJson).length : 0), [parsedJson]);
  const tokenSavingPct =
    status === "done" && rawTokens > 0 && jsonTokens > 0 && rawTokens < jsonTokens
      ? Math.round(((jsonTokens - rawTokens) / jsonTokens) * 100)
      : null;

  // Theme
  const currentTheme = useMemo<Theme>(() => {
    if (theme === "light" || theme === "dark" || theme === "system") {
      return theme;
    }
    return "system";
  }, [theme]);

  const resolvedMode = resolvedTheme === "dark" ? "dark" : "light";

  const cycleTheme = () =>
    setTheme(currentTheme === "system" ? "light" : currentTheme === "light" ? "dark" : "system");

  // Timer
  useEffect(() => {
    if (!isStreaming || !startTime) return;
    const iv = setInterval(() => setElapsed(Date.now() - startTime), 100);
    return () => clearInterval(iv);
  }, [isStreaming, startTime]);

  // ── GitHub connect ───────────────────────────────────────────────────

  const rawToolsRef = useRef<Record<
    string,
    (args: Record<string, unknown>) => Promise<unknown>
  > | null>(null);
  const resetToolCallsRef = useRef<(() => void) | null>(null);

  const handleConnect = useCallback((username: string) => {
    const rawTools = createGitHubToolProvider(username);
    rawToolsRef.current = rawTools;
    const { tools: wrapped, resetCalls } = wrapToolProvider(rawTools, (calls) => {
      setToolCalls([...calls]);
    });
    resetToolCallsRef.current = resetCalls;
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
    setStreamResponseHasCode(false);
    setElapsed(null);
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
      resetToolCallsRef.current?.();
      setStreamResponseHasCode(false);
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
        if (m.role === "user" && i === updated.length - 1 && existingCode) {
          return {
            role: m.role,
            content: `${m.content}\n\n<current-dashboard>\n${existingCode}\n</current-dashboard>`,
          };
        }
        return { role: m.role, content: m.content };
      });

      // Prefetch GitHub data on first message to warm cache + give LLM context
      // Use raw (unwrapped) tools to avoid triggering tool-call tracking side effects
      let githubContext = "";
      if (conversation.length === 0 && rawToolsRef.current) {
        try {
          githubContext = await prefetchAndSummarize(rawToolsRef.current);
        } catch {
          // Non-critical — LLM just won't have data context
        }
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamChat(
          {
            prompt: githubContext ? `${githubContext}\n\n${trimmed}` : trimmed,
            messages: apiMessages.slice(0, -1),
          },
          (chunk) => {
            responseRef.current += chunk;
            const raw = responseRef.current;
            setStreamingText(extractText(raw) || "");
            setStreamResponseHasCode(responseHasCode(raw));
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
            setStreamResponseHasCode(false);
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
          setStreamResponseHasCode(false);
          setStatus("idle");
          return;
        }
        setErrorMsg(err instanceof Error ? err.message : "Unknown error");
        setStreamResponseHasCode(false);
        setStatus("error");
      }
    },
    [isStreaming, conversation, dashboardCode],
  );

  // Process pending prompt after GitHub connect
  useEffect(() => {
    if (githubUsername && toolProvider && pendingPromptRef.current) {
      const p = pendingPromptRef.current;
      pendingPromptRef.current = null;
      send(p);
    }
  }, [githubUsername, toolProvider, send]);

  const handleStop = () => {
    abortRef.current?.abort();
    setStreamResponseHasCode(false);
    setStatus("idle");
  };

  const handleConnectAndPrompt = useCallback(
    (username: string, promptText: string) => {
      pendingPromptRef.current = promptText;
      handleConnect(username);
    },
    [handleConnect],
  );

  // ── Render ─────────────────────────────────────────────────────────────

  const showConversation = conversation.length > 0 || isStreaming;

  return (
    <div className={`app ${isHomeState ? "app-home" : "app-artifact"}`}>
      <Header
        theme={currentTheme}
        onThemeToggle={cycleTheme}
        borderMode={isHomeState ? "scroll" : "always"}
      />

      <div className={`app-body ${isHomeState ? "app-body-home" : ""}`}>
        {/* Phase 1: Connect Screen */}
        {isHomeState && (
          <div className="content-wrapper content-wrapper-home">
            <GitHubConnect onConnectAndPrompt={handleConnectAndPrompt} />
          </div>
        )}

        {/* Phase 2: Artifact Layout */}
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
                  <Button
                    className="gh-connected-change"
                    variant="tertiary"
                    size="extra-small"
                    onClick={handleDisconnect}
                  >
                    Change
                  </Button>
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
                        className="gh-welcome-avatar-image"
                      />
                    </span>
                    Connected as <strong>@{githubUsername}</strong>. What do you want to build?
                  </div>
                  <div className="gh-starters-grid gh-starters-grid-compact">
                    {GITHUB_STARTERS.map((s) => (
                      <Button
                        key={s.prompt}
                        className="gh-starter-card"
                        variant="tertiary"
                        size="large"
                        onClick={() => send(s.prompt)}
                        disabled={isStreaming}
                      >
                        <span className={`gh-starter-icon gh-tone-${s.tone}`}>
                          {renderStarterIcon(s.icon)}
                        </span>
                        <div className="gh-starter-label">{s.label}</div>
                        <div className="gh-starter-desc">
                          {s.prompt.length > 60 ? s.prompt.slice(0, 60) + "..." : s.prompt}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta + source toggle + token comparison */}
              {hasDashboard && !isStreaming && (
                <div className="dashboard-meta">
                  <span className="dashboard-model-label">{GITHUB_DEMO_MODEL_LABEL}</span>
                  {elapsed && (
                    <span className="dashboard-elapsed">{(elapsed / 1000).toFixed(1)}s</span>
                  )}
                  {tokenSavingPct !== null && (
                    <span className="dashboard-token-saving">
                      <Zap size={10} />
                      {tokenSavingPct}% fewer tokens
                    </span>
                  )}
                  <Button
                    className="dashboard-source-toggle"
                    variant="tertiary"
                    size="extra-small"
                    onClick={() => setShowSource(!showSource)}
                  >
                    <Code2 size={12} />
                    {showSource ? "Hide code" : "View code"}
                  </Button>
                </div>
              )}

              {/* Source code view with tabs */}
              {hasDashboard &&
                showSource &&
                (() => {
                  const activeSource =
                    sourceTab === "raw"
                      ? (dashboardCode ?? "")
                      : (parsedJson ?? "Waiting for parse...");
                  const handleCopy = async () => {
                    await navigator.clipboard.writeText(activeSource);
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 2000);
                  };
                  return (
                    <div className="dashboard-source-panel">
                      <div className="dashboard-source-header">
                        <div className="dashboard-source-tabs">
                          <button
                            className={`dashboard-source-tab ${sourceTab === "raw" ? "dashboard-source-tab-active" : ""}`}
                            onClick={() => {
                              setSourceTab("raw");
                              setCodeCopied(false);
                            }}
                          >
                            openui-lang
                            {rawTokens > 0 && (
                              <span className="dashboard-source-token-count">
                                {rawTokens.toLocaleString()}
                              </span>
                            )}
                          </button>
                          <button
                            className={`dashboard-source-tab ${sourceTab === "json" ? "dashboard-source-tab-active" : ""}`}
                            onClick={() => {
                              setSourceTab("json");
                              setCodeCopied(false);
                            }}
                          >
                            Parsed JSON
                            {jsonTokens > 0 && (
                              <span className="dashboard-source-token-count">
                                {jsonTokens.toLocaleString()}
                              </span>
                            )}
                          </button>
                        </div>
                        <button
                          className="dashboard-source-copy"
                          onClick={handleCopy}
                          title="Copy code"
                        >
                          {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      <div className="dashboard-source">
                        <Highlight
                          theme={resolvedMode === "dark" ? themes.oneDark : themes.oneLight}
                          code={activeSource.trim()}
                          language={sourceTab === "json" ? "json" : "javascript"}
                        >
                          {({ className, style, tokens, getLineProps, getTokenProps }) => (
                            <pre
                              className={className}
                              style={{ ...style, margin: 0, background: "transparent" }}
                            >
                              <code>
                                {tokens.map((line, i) => (
                                  <div key={i} {...getLineProps({ line })}>
                                    {line.map((token, j) => (
                                      <span key={j} {...getTokenProps({ token })} />
                                    ))}
                                  </div>
                                ))}
                              </code>
                            </pre>
                          )}
                        </Highlight>
                      </div>
                    </div>
                  );
                })()}

              {/* Live data indicator */}
              {hasDashboard && toolCalls.length > 0 && (
                <div
                  className={`dashboard-data-strip ${toolCalls.some((t) => t.status === "pending") ? "dashboard-data-strip-loading" : ""}`}
                >
                  <span className="dashboard-data-label">
                    {toolCalls.some((t) => t.status === "pending")
                      ? "Fetching live data..."
                      : "Live data from GitHub"}
                  </span>
                  <div className="dashboard-data-chips">
                    {toolCalls.map((tc, i) => (
                      <span
                        key={i}
                        className={`dashboard-data-chip dashboard-data-chip-${tc.status}`}
                      >
                        {tc.status === "done" ? "✓" : tc.status === "error" ? "✗" : "⏳"}{" "}
                        {tc.tool.replace("get_", "")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dashboard renderer */}
              {hasDashboard && (
                <div className="dashboard-renderer">
                  <PreviewPanel
                    code={dashboardCode!}
                    isStreaming={isStreaming}
                    onParseResult={(r) => setParsedJson(r ? JSON.stringify(r, null, 2) : null)}
                    mode={resolvedMode}
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

              {/* Streaming placeholder */}
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
                onSend={send}
                onStop={handleStop}
                hasDashboard={hasDashboard}
                responseHasCode={streamResponseHasCode}
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
