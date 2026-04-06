"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { McpClientLike } from "@openuidev/react-lang";
import { mergeStatements } from "@openuidev/react-lang";
import { wrapMcpClient } from "@/lib/mcp-tracker";
import type { ToolCallEntry } from "@/lib/mcp-tracker";
import { streamChat } from "@/lib/llm-stream";
import type { LLMToolCall } from "@/lib/llm-stream";
import { extractCodeOnly, extractText, responseHasCode, isPureCode } from "@/lib/response-parser";
import type { ChatMessage } from "./types";

// ── Context shape ────────────────────────────────────────────────────────────

interface DashboardContextValue {
  conversation: ChatMessage[];
  dashboardCode: string | null;
  isStreaming: boolean;
  streamingText: string;
  streamingHasCode: boolean;
  elapsed: number | null;
  llmTools: LLMToolCall[];
  toolCalls: ToolCallEntry[];
  toolProvider: McpClientLike | null;
  send: (text: string) => void;
  clear: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────

interface DashboardProviderProps {
  chatEndpoint: string;
  mcpEndpoint: string;
  children: ReactNode;
}

export function DashboardProvider({ chatEndpoint, mcpEndpoint, children }: DashboardProviderProps) {
  const [dashboardCode, setDashboardCode] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingHasCode, setStreamingHasCode] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCallEntry[]>([]);
  const [llmTools, setLlmTools] = useState<LLMToolCall[]>([]);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState<string>("");
  const [toolProvider, setToolProvider] = useState<McpClientLike | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const responseRef = useRef("");
  const llmToolCallsRef = useRef<LLMToolCall[]>([]);
  const toolCallsRef = useRef<ToolCallEntry[]>([]);
  const clientRef = useRef<McpClientLike | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
        const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
        const client = new Client({ name: "openui-dashboard", version: "1.0.0" });
        const transport = new StreamableHTTPClientTransport(new URL(mcpEndpoint, globalThis.location.href));
        await client.connect(transport);
        if (cancelled) { client.close?.(); return; }
        const mcpClient = client as unknown as McpClientLike;
        clientRef.current = mcpClient;
        setToolProvider(wrapMcpClient(mcpClient, (calls) => {
          toolCallsRef.current = calls;
          setToolCalls(calls);
          setConversation((prev) => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            if (last.role !== "assistant") return prev;
            return [...prev.slice(0, -1), { ...last, runtimeTools: calls }];
          });
        }));
      } catch (err) {
        console.error("[mcp] Failed:", err);
      }
    })();
    return () => { cancelled = true; clientRef.current?.close?.(); };
  }, [mcpEndpoint]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("code");
    if (p) { try { setDashboardCode(atob(p)); } catch { /* */ } }
  }, []);

  useEffect(() => {
    if (!isStreaming || !startTime) return;
    const iv = setInterval(() => setElapsed(Date.now() - startTime), 100);
    return () => clearInterval(iv);
  }, [isStreaming, startTime]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;
      const trimmed = text.trim();
      setIsStreaming(true);
      setStreamingHasCode(false);
      setStartTime(null);
      setElapsed(null);
      toolCallsRef.current = [];
      setToolCalls([]);
      responseRef.current = "";
      llmToolCallsRef.current = [];
      setStreamingText("");
      let streamStartTime: number | null = null;

      const userMsg: ChatMessage = { role: "user", content: trimmed, hasCode: false };
      const updated = [...conversation, userMsg];
      setConversation(updated);
      const existingCode = dashboardCode;

      const apiMessages = updated.map((m, i) => {
        if (m.role === "assistant" && m.llmTools?.length) {
          const toolSummary = m.llmTools
            .map((tc) => {
              const snippet = tc.result ? ` → ${tc.result.slice(0, 500)}` : " → completed";
              return `[Tool: ${tc.name}${snippet}]`;
            })
            .join("\n");
          return { role: m.role, content: `${toolSummary}\n\n${m.content}` };
        }
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
        chatEndpoint,
        apiMessages,
        (chunk) => {
          responseRef.current += chunk;
          const raw = responseRef.current;
          setStreamingText(extractText(raw) || "");
          if (responseHasCode(raw)) setStreamingHasCode(true);
          setDashboardCode(existingCode ? existingCode + "\n" + raw : raw);
        },
        () => {
          setIsStreaming(false);
          setStreamingText("");
          if (streamStartTime) setElapsed(Date.now() - streamStartTime);

          const raw = responseRef.current;
          const hasCode = responseHasCode(raw);
          const pureCode = isPureCode(raw);
          const text = pureCode ? undefined : extractText(raw) || undefined;
          const llmToolsCurrent = llmToolCallsRef.current;

          setConversation((prev) => [
            ...prev,
            {
              role: "assistant",
              content: raw,
              text,
              hasCode,
              llmTools: llmToolsCurrent.length > 0 ? [...llmToolsCurrent] : undefined,
              runtimeTools: toolCallsRef.current.length > 0 ? [...toolCallsRef.current] : undefined,
            },
          ]);

          if (hasCode) {
            const newCode = pureCode ? raw : extractCodeOnly(raw);
            if (newCode) {
              setDashboardCode(existingCode ? mergeStatements(existingCode, newCode) : newCode);
            }
          }
        },
        (calls) => {
          llmToolCallsRef.current = calls;
          setLlmTools(calls);
        },
        controller.signal,
        () => { streamStartTime = Date.now(); setStartTime(streamStartTime); },
      );
    },
    [isStreaming, conversation, dashboardCode, chatEndpoint],
  );

  const clear = () => {
    abortRef.current?.abort();
    setDashboardCode(null);
    setConversation([]);
    setIsStreaming(false);
    setStreamingHasCode(false);
    setStartTime(null);
    setElapsed(null);
    responseRef.current = "";
  };

  return (
    <DashboardContext.Provider value={{
      conversation,
      dashboardCode,
      isStreaming,
      streamingText,
      streamingHasCode,
      elapsed,
      llmTools,
      toolCalls,
      toolProvider,
      send,
      clear,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
