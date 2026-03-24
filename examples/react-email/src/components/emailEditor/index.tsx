"use client";

import { useAutoScroll } from "@/hooks/useAutoScroll";
import { useClipboard } from "@/hooks/useClipboard";
import { useEmailRendering } from "@/hooks/useEmailRendering";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useThread } from "@openuidev/react-headless";
import { useMemo, useState } from "react";
import { HtmlPanel } from "./htmlPanel";
import { MessageInput } from "./messageInput";
import { MobileTabToggle } from "./mobileTabToggle";
import { PreviewPanel } from "./previewPanel";
import { TopBar } from "./topBar";

export function EmailEditor({ onNewEmail }: { onNewEmail: () => void }) {
  const [input, setInput] = useState("");
  const isDark = true;
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<"html" | "preview">("preview");

  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const processMessage = useThread((s) => s.processMessage);

  const lastAssistantMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") return messages[i];
    }
    return null;
  }, [messages]);

  const isStreaming = useMemo(
    () => isRunning && !!lastAssistantMessage,
    [isRunning, lastAssistantMessage],
  );

  const openuiCode = useMemo(
    () => (lastAssistantMessage?.content as string) ?? null,
    [lastAssistantMessage],
  );

  const previewRef = useAutoScroll([lastAssistantMessage?.content], isRunning);
  const { renderedHtml, htmlLoading, emailSubject, handleParseResult } = useEmailRendering(
    openuiCode,
    isStreaming,
    isRunning,
  );
  const htmlClipboard = useClipboard();
  const subjectClipboard = useClipboard();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRunning) return;
    processMessage({ role: "user", content: input.trim() });
    setInput("");
  };

  const hasContent = !!openuiCode || !!lastAssistantMessage;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: isDark ? "#050505" : "#f5f5f5",
      }}
    >
      <TopBar isDark={isDark} isMobile={isMobile} isRunning={isRunning} onNewEmail={onNewEmail} />

      {isMobile && hasContent && (
        <MobileTabToggle isDark={isDark} mobileTab={mobileTab} onTabChange={setMobileTab} />
      )}

      {/* Content area */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {hasContent && (!isMobile || mobileTab === "html") && (
          <HtmlPanel
            isDark={isDark}
            isMobile={isMobile}
            isStreaming={isStreaming}
            renderedHtml={renderedHtml}
            htmlLoading={htmlLoading}
            copied={htmlClipboard.copied}
            onCopy={() => renderedHtml && htmlClipboard.copy(renderedHtml)}
          />
        )}

        {(!isMobile || mobileTab === "preview" || !hasContent) && (
          <PreviewPanel
            isDark={isDark}
            isMobile={isMobile}
            hasContent={hasContent}
            openuiCode={openuiCode}
            isStreaming={isStreaming}
            isRunning={isRunning}
            emailSubject={emailSubject}
            copiedSubject={subjectClipboard.copied}
            onCopySubject={() => emailSubject && subjectClipboard.copy(emailSubject)}
            onParseResult={handleParseResult}
            scrollRef={previewRef}
          />
        )}
      </div>

      <MessageInput
        isDark={isDark}
        isMobile={isMobile}
        isRunning={isRunning}
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
