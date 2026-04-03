"use client";

import { emailLibrary } from "@openuidev/react-email";
import type { ParseResult } from "@openuidev/react-lang";
import { Renderer } from "@openuidev/react-lang";
import { Check as CheckIcon, Copy as CopyIcon, Mail as MailIcon } from "lucide-react";
import type { RefObject } from "react";
import { LoadingDots } from "../loadingDots";

interface PreviewPanelProps {
  isDark: boolean;
  isMobile: boolean;
  hasContent: boolean;
  openuiCode: string | null;
  isStreaming: boolean;
  isRunning: boolean;
  emailSubject: string | null;
  copiedSubject: boolean;
  onCopySubject: () => void;
  onParseResult: (result: ParseResult | null) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
}

export function PreviewPanel({
  isDark,
  isMobile,
  hasContent,
  openuiCode,
  isStreaming,
  isRunning,
  emailSubject,
  copiedSubject,
  onCopySubject,
  onParseResult,
  scrollRef,
}: PreviewPanelProps) {
  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        minWidth: 0,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header (desktop only) */}
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
              onClick={onCopySubject}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: 500,
                borderRadius: "8px",
                border: "none",
                backgroundColor: copiedSubject ? "#16a34a" : isDark ? "#1f1f1f" : "#f3f4f6",
                color: copiedSubject ? "#ffffff" : isDark ? "#e5e7eb" : "#374151",
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

      {/* Content */}
      <div style={{ flex: 1, padding: hasContent ? "16px 20px" : "32px 24px" }}>
        {openuiCode ? (
          <Renderer
            response={openuiCode}
            library={emailLibrary}
            isStreaming={isStreaming}
            onParseResult={onParseResult}
          />
        ) : isRunning ? (
          <LoadingState isDark={isDark} />
        ) : null}
      </div>
    </div>
  );
}

function LoadingState({ isDark }: { isDark: boolean }) {
  return (
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
        <MailIcon size={28} color={isDark ? "#818cf8" : "#5F51E8"} />
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
  );
}
