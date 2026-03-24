"use client";

import { Check as CheckIcon, Copy as CopyIcon } from "lucide-react";
import { LoadingDots } from "../loadingDots";

interface HtmlPanelProps {
  isDark: boolean;
  isMobile: boolean;
  isStreaming: boolean;
  renderedHtml: string | null;
  htmlLoading: boolean;
  copied: boolean;
  onCopy: () => void;
}

export function HtmlPanel({
  isDark,
  isMobile,
  isStreaming,
  renderedHtml,
  htmlLoading,
  copied,
  onCopy,
}: HtmlPanelProps) {
  return (
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
      {/* Header */}
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
            <span style={{ fontSize: "11px", color: isDark ? "#818cf8" : "#5F51E8" }}>
              Rendering...
            </span>
          )}
        </div>
        {renderedHtml && (
          <button
            onClick={onCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 12px",
              fontSize: "12px",
              fontWeight: 500,
              borderRadius: "8px",
              border: "none",
              backgroundColor: copied ? "#16a34a" : isDark ? "#1f1f1f" : "#f3f4f6",
              color: copied ? "#ffffff" : isDark ? "#e5e7eb" : "#374151",
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

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
        {renderedHtml ? (
          <pre
            style={{
              margin: 0,
              fontSize: "12px",
              lineHeight: "1.7",
              fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', 'Courier New', monospace",
              color: isDark ? "#d4d4d4" : "#374151",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            <code>{renderedHtml}</code>
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
          <span style={{ color: isDark ? "#4B5563" : "#D1D5DB", fontSize: "13px" }}>
            HTML will appear here once the email is generated.
          </span>
        )}
      </div>
    </div>
  );
}
