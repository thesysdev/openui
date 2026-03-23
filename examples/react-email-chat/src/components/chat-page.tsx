"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/hooks/use-system-theme";
import { emailChatLibrary } from "@/lib/chat-library";
import { renderEmailToHtml } from "@/app/actions/render-email";
import { useThread } from "@openuidev/react-headless";
import type { ActionEvent, ParseResult } from "@openuidev/react-lang";
import { BuiltinActionType, Renderer } from "@openuidev/react-lang";
import { MailIcon, PlusIcon, SendIcon, CopyIcon, CheckIcon } from "./icons";
import { formatHtml } from "./format-html";
import { LoadingDots } from "./loading-dots";
import {
  wrapContent,
  wrapContext,
  separateContentAndContext,
} from "./content-parser";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

export function ChatPage({
  onNewEmail,
}: {
  onNewEmail: () => void;
}) {
  const [input, setInput] = useState("");
  const isDark = useTheme() === "dark";
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<"html" | "preview">("preview");
  const previewRef = useRef<HTMLDivElement>(null);

  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const processMessage = useThread((s) => s.processMessage);
  const updateMessage = useThread((s) => s.updateMessage);

  const lastAssistantMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") return messages[i];
    }
    return null;
  }, [messages]);

  const isStreaming = useMemo(() => {
    if (!isRunning || !lastAssistantMessage) return false;
    return true;
  }, [isRunning, lastAssistantMessage]);

  const { openuiCode, initialState } = useMemo(() => {
    if (!lastAssistantMessage?.content) {
      return { openuiCode: null, initialState: undefined };
    }
    const { content, contextString } = separateContentAndContext(
      lastAssistantMessage.content as string
    );
    let state: Record<string, unknown> | undefined;
    if (contextString) {
      try {
        const parsed = JSON.parse(contextString);
        if (Array.isArray(parsed) && typeof parsed[0] === "object")
          state = parsed[0];
        else if (typeof parsed === "object" && !Array.isArray(parsed))
          state = parsed;
      } catch {
        /* ignore */
      }
    }
    return { openuiCode: content, initialState: state };
  }, [lastAssistantMessage]);

  const handleStateUpdate = useCallback(
    (state: Record<string, unknown>) => {
      if (!lastAssistantMessage) return;
      const code = openuiCode ?? "";
      const contextJson = JSON.stringify([state]);
      const fullMessage = code + "\n" + wrapContext(contextJson);
      updateMessage({
        ...lastAssistantMessage,
        content: fullMessage,
      } as Parameters<typeof updateMessage>[0]);
    },
    [updateMessage, lastAssistantMessage, openuiCode]
  );

  const handleAction = useCallback(
    (event: ActionEvent) => {
      if (event.type === BuiltinActionType.ContinueConversation) {
        const contentPart = event.humanFriendlyMessage
          ? wrapContent(event.humanFriendlyMessage)
          : "";
        const messageCtx: (string | object)[] = [
          `User clicked: ${event.humanFriendlyMessage}`,
        ];
        if (event.formState) {
          messageCtx.push(event.formState);
        }
        const contextPart = wrapContext(JSON.stringify(messageCtx));
        processMessage({
          role: "user",
          content: `${contentPart}${contextPart}`,
        });
      } else if (event.type === BuiltinActionType.OpenUrl) {
        const url = event.params?.["url"] as string | undefined;
        if (typeof window !== "undefined" && url) {
          window.open(url, "_blank");
        }
      }
    },
    [processMessage]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRunning) return;
    processMessage({ role: "user", content: input.trim() });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.scrollTop = previewRef.current.scrollHeight;
    }
  }, [lastAssistantMessage?.content]);

  // ── Render HTML from parsed result ──
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [emailSubject, setEmailSubject] = useState<string | null>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const lastParsedRef = useRef<ParseResult | null>(null);
  const renderingRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function findTemplate(node: any): any {
    if (node?.typeName === "EmailTemplate") return node;
    const children = node?.props?.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        const found = findTemplate(child);
        if (found) return found;
      }
    }
    return null;
  }

  const handleParseResult = useCallback(
    (result: ParseResult | null) => {
      lastParsedRef.current = result;
    },
    []
  );

  // Trigger HTML rendering when streaming stops
  useEffect(() => {
    if (isStreaming || renderingRef.current) return;
    const result = lastParsedRef.current;
    if (!result?.root) return;

    const template = findTemplate(result.root);
    if (!template) return;

    renderingRef.current = true;
    setHtmlLoading(true);

    const subject = String(template.props?.subject ?? "");
    setEmailSubject(subject);
    const previewText = String(template.props?.previewText ?? "");
    const children = (template.props?.children ?? []) as Array<{
      typeName: string;
      props: Record<string, unknown>;
    }>;

    renderEmailToHtml(subject, previewText, children)
      .then((html) => setRenderedHtml(html))
      .catch(() => setRenderedHtml(null))
      .finally(() => {
        setHtmlLoading(false);
        renderingRef.current = false;
      });
  }, [isStreaming]);

  // Clear HTML when starting new generation
  useEffect(() => {
    if (isRunning && !lastAssistantMessage?.content) {
      setRenderedHtml(null);
      setEmailSubject(null);
      lastParsedRef.current = null;
      renderingRef.current = false;
    }
  }, [isRunning, lastAssistantMessage?.content]);

  // Copy HTML to clipboard
  const [copied, setCopied] = useState(false);
  const copyHtml = useCallback(() => {
    if (!renderedHtml) return;
    navigator.clipboard.writeText(renderedHtml).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [renderedHtml]);

  const copySubject = useCallback(() => {
    if (!emailSubject) return;
    navigator.clipboard.writeText(emailSubject).then(() => {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    });
  }, [emailSubject]);

  // Format HTML for display
  const formattedHtml = useMemo(() => {
    if (!renderedHtml) return null;
    return formatHtml(renderedHtml);
  }, [renderedHtml]);

  const hasContent = openuiCode || lastAssistantMessage;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: isDark ? "#050505" : "#f5f5f5",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
          borderBottom: `1px solid ${isDark ? "#1a1a1a" : "#e5e7eb"}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              backgroundColor: isDark ? "#1a1a2e" : "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MailIcon size={16} color={isDark ? "#818cf8" : "#5F51E8"} />
          </div>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: isDark ? "#f5f5f5" : "#111827",
            }}
          >
            Email Generator
          </span>
          {isRunning && (
            isMobile ? (
              <>
                <style>{`
                  @keyframes email-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "2px solid transparent",
                    borderTopColor: "#5F51E8",
                    borderRightColor: "#5F51E8",
                    animation: "email-spin 0.8s linear infinite",
                    marginLeft: "6px",
                  }}
                />
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "16px",
                  backgroundColor: isDark ? "#1a1a2e" : "#EEF2FF",
                  marginLeft: "4px",
                }}
              >
                <style>{`
                  @keyframes email-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                  }
                `}</style>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#5F51E8",
                    animation: "email-pulse 1.5s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: isDark ? "#818cf8" : "#5F51E8",
                  }}
                >
                  Generating...
                </span>
              </div>
            )
          )}
        </div>

        <button
          onClick={onNewEmail}
          title="New Email"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? 0 : "6px",
            padding: isMobile ? "8px" : "8px 16px",
            borderRadius: isMobile ? "8px" : "10px",
            border: `1px solid ${isDark ? "#1f1f1f" : "#e5e7eb"}`,
            backgroundColor: isDark ? "#111111" : "#ffffff",
            color: isDark ? "#e5e7eb" : "#374151",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s",
            width: isMobile ? "36px" : undefined,
            height: isMobile ? "36px" : undefined,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#5F51E8";
            e.currentTarget.style.backgroundColor = isDark
              ? "#1a1a2e"
              : "#EEF2FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isDark ? "#1f1f1f" : "#e5e7eb";
            e.currentTarget.style.backgroundColor = isDark
              ? "#111111"
              : "#ffffff";
          }}
        >
          <PlusIcon size={isMobile ? 16 : 14} color={isDark ? "#e5e7eb" : "#374151"} />
          {!isMobile && "New Email"}
        </button>
      </div>

      {/* ── Mobile toggle (only on mobile when content exists) ── */}
      {isMobile && hasContent && (
        <div
          style={{
            display: "flex",
            padding: "8px 16px",
            gap: "4px",
            borderBottom: `1px solid ${isDark ? "#1a1a1a" : "#e5e7eb"}`,
            backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setMobileTab("html")}
            style={{
              flex: 1,
              padding: "8px",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              backgroundColor:
                mobileTab === "html"
                  ? isDark ? "#1a1a2e" : "#EEF2FF"
                  : "transparent",
              color:
                mobileTab === "html"
                  ? isDark ? "#818cf8" : "#5F51E8"
                  : isDark ? "#6B7280" : "#9CA3AF",
              transition: "all 0.15s",
            }}
          >
            HTML
          </button>
          <button
            onClick={() => setMobileTab("preview")}
            style={{
              flex: 1,
              padding: "8px",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              backgroundColor:
                mobileTab === "preview"
                  ? isDark ? "#1a1a2e" : "#EEF2FF"
                  : "transparent",
              color:
                mobileTab === "preview"
                  ? isDark ? "#818cf8" : "#5F51E8"
                  : isDark ? "#6B7280" : "#9CA3AF",
              transition: "all 0.15s",
            }}
          >
            Preview
          </button>
        </div>
      )}

      {/* ── Content area ── */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
        }}
      >
        {/* Left — HTML code (desktop always, mobile when tab=html) */}
        {hasContent && (!isMobile || mobileTab === "html") && (
          <div
            style={{
              width: isMobile ? "100%" : "45%",
              flexShrink: 0,
              backgroundColor: isDark ? "#0a0a0a" : "#fafafa",
              borderRight: isMobile ? "none" : `1px solid ${isDark ? "#1a1a1a" : "#e5e7eb"}`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                borderBottom: `1px solid ${isDark ? "#1a1a1a" : "#e5e7eb"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: isDark ? "#6B7280" : "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  HTML
                </span>
                {htmlLoading && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: isDark ? "#818cf8" : "#5F51E8",
                    }}
                  >
                    Rendering...
                  </span>
                )}
              </div>
              {renderedHtml && (
                <button
                  onClick={copyHtml}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: 500,
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: copied
                      ? "#16a34a"
                      : isDark
                        ? "#1f1f1f"
                        : "#f3f4f6",
                    color: copied
                      ? "#ffffff"
                      : isDark
                        ? "#e5e7eb"
                        : "#374151",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {copied ? (
                    <CheckIcon size={12} color="#ffffff" />
                  ) : (
                    <CopyIcon size={12} color={isDark ? "#e5e7eb" : "#374151"} />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "16px 20px",
              }}
            >
              {formattedHtml ? (
                <pre
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    lineHeight: "1.7",
                    fontFamily:
                      "ui-monospace, 'Cascadia Code', 'Fira Code', 'Courier New', monospace",
                    color: isDark ? "#d4d4d4" : "#374151",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  <code>{formattedHtml}</code>
                </pre>
              ) : isStreaming ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: isDark ? "#6B7280" : "#9CA3AF",
                    fontSize: "13px",
                  }}
                >
                  <LoadingDots color={isDark ? "#818cf8" : "#5F51E8"} />
                  <span>Waiting for email to complete...</span>
                </div>
              ) : (
                <span
                  style={{
                    color: isDark ? "#4B5563" : "#D1D5DB",
                    fontSize: "13px",
                  }}
                >
                  HTML will appear here once the email is generated.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Right — Preview (desktop always, mobile when tab=preview) */}
        {(!isMobile || mobileTab === "preview" || !hasContent) && (
        <div
          ref={previewRef}
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {hasContent && !isMobile && (
            <div
              style={{
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                borderBottom: `1px solid ${isDark ? "#1a1a1a" : "#e5e7eb"}`,
                backgroundColor: isDark ? "#050505" : "#f5f5f5",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: isDark ? "#6B7280" : "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Preview
              </span>
              {emailSubject && (
                <button
                  onClick={copySubject}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: 500,
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: copiedSubject
                      ? "#16a34a"
                      : isDark
                        ? "#1f1f1f"
                        : "#f3f4f6",
                    color: copiedSubject
                      ? "#ffffff"
                      : isDark
                        ? "#e5e7eb"
                        : "#374151",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {copiedSubject ? (
                    <CheckIcon size={12} color="#ffffff" />
                  ) : (
                    <CopyIcon size={12} color={isDark ? "#e5e7eb" : "#374151"} />
                  )}
                  {copiedSubject ? "Copied!" : "Copy Subject"}
                </button>
              )}
            </div>
          )}
          <div
            style={{
              flex: 1,
              padding: hasContent ? "16px 20px" : "32px 24px",
            }}
          >
            {openuiCode ? (
              <Renderer
                response={openuiCode}
                library={emailChatLibrary}
                isStreaming={isStreaming}
                onAction={handleAction}
                onStateUpdate={handleStateUpdate}
                initialState={initialState}
                onParseResult={handleParseResult}
              />
            ) : isRunning ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "300px",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "16px",
                    backgroundColor: isDark ? "#1a1a2e" : "#EEF2FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MailIcon
                    size={28}
                    color={isDark ? "#818cf8" : "#5F51E8"}
                  />
                </div>
                <LoadingDots color={isDark ? "#818cf8" : "#5F51E8"} />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: isDark ? "#6B7280" : "#9CA3AF",
                  }}
                >
                  Crafting your email...
                </span>
              </div>
            ) : lastAssistantMessage ? (
              <Renderer
                response={openuiCode}
                library={emailChatLibrary}
                isStreaming={false}
                onAction={handleAction}
                onStateUpdate={handleStateUpdate}
                initialState={initialState}
                onParseResult={handleParseResult}
              />
            ) : null}
          </div>
        </div>
        )}
      </div>

      {/* ── Bottom input ── */}
      <div
        style={{
          flexShrink: 0,
          padding: isMobile ? "8px 12px" : "16px 24px",
          backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
          borderTop: `1px solid ${isDark ? "#1a1a1a" : "#e5e7eb"}`,
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ margin: "0 auto", maxWidth: isMobile ? "100%" : "800px" }}
        >
          <div
            style={{
              borderRadius: isMobile ? "10px" : "14px",
              border: `1px solid ${isDark ? "#1f1f1f" : "#e5e7eb"}`,
              backgroundColor: isDark ? "#111111" : "#f9fafb",
              overflow: "hidden",
              transition: "border-color 0.2s, box-shadow 0.2s",
              opacity: isRunning ? 0.5 : 1,
              display: isMobile ? "flex" : undefined,
              alignItems: isMobile ? "center" : undefined,
            }}
          >
            {isMobile ? (
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for changes..."
                disabled={isRunning}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  fontSize: "14px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: isDark ? "#f5f5f5" : "#111827",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  if (!isRunning) {
                    const container = e.currentTarget.parentElement;
                    if (container) {
                      container.style.borderColor = "#5F51E8";
                    }
                  }
                }}
                onBlur={(e) => {
                  const container = e.currentTarget.parentElement;
                  if (container) {
                    container.style.borderColor = isDark ? "#1f1f1f" : "#e5e7eb";
                  }
                }}
              />
            ) : (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you'd like to change..."
              disabled={isRunning}
              rows={3}
              style={{
                width: "100%",
                padding: "16px 16px 40px 16px",
                fontSize: "14px",
                lineHeight: "1.6",
                border: "none",
                backgroundColor: "transparent",
                color: isDark ? "#f5f5f5" : "#111827",
                outline: "none",
                boxSizing: "border-box",
                resize: "none",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                if (!isRunning) {
                  const container = e.currentTarget.parentElement;
                  if (container) {
                    container.style.borderColor = "#5F51E8";
                    container.style.boxShadow = isDark
                      ? "0 0 0 1px #5F51E8"
                      : "0 0 0 3px rgba(95, 81, 232, 0.1)";
                  }
                }
              }}
              onBlur={(e) => {
                const container = e.currentTarget.parentElement;
                if (container) {
                  container.style.borderColor = isDark ? "#1f1f1f" : "#e5e7eb";
                  container.style.boxShadow = "none";
                }
              }}
            />
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: isMobile ? "0 6px 0 0" : "0 10px 10px 10px",
              }}
            >
              <button
                type="submit"
                disabled={isRunning}
                style={{
                  width: isMobile ? "32px" : "36px",
                  height: isMobile ? "32px" : "36px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor:
                    input.trim() && !isRunning
                      ? "#5F51E8"
                      : isDark
                        ? "#1a1a1a"
                        : "#e5e7eb",
                  cursor: input.trim() && !isRunning ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color 0.2s",
                }}
              >
                <SendIcon
                  size={16}
                  color={
                    input.trim() && !isRunning
                      ? "#ffffff"
                      : isDark
                        ? "#4B5563"
                        : "#9CA3AF"
                  }
                />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
