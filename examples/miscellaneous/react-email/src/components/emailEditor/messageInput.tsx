"use client";

import { Send as SendIcon } from "lucide-react";

interface MessageInputProps {
  isDark: boolean;
  isMobile: boolean;
  isRunning: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MessageInput({
  isDark,
  isMobile,
  isRunning,
  input,
  onInputChange,
  onSubmit,
}: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const hasInput = input.trim().length > 0;

  return (
    <div
      style={{
        flexShrink: 0,
        padding: isMobile ? "8px 12px" : "16px 24px",
        backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
        borderTop: `1px solid ${isDark ? "#1a1a1a" : "#e5e7eb"}`,
      }}
    >
      <form onSubmit={onSubmit} style={{ margin: "0 auto", maxWidth: isMobile ? "100%" : "800px" }}>
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
              onChange={(e) => onInputChange(e.target.value)}
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
                  if (container) container.style.borderColor = "#5F51E8";
                }
              }}
              onBlur={(e) => {
                const container = e.currentTarget.parentElement;
                if (container) container.style.borderColor = isDark ? "#1f1f1f" : "#e5e7eb";
              }}
            />
          ) : (
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
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
                  hasInput && !isRunning ? "#5F51E8" : isDark ? "#1a1a1a" : "#e5e7eb",
                cursor: hasInput && !isRunning ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s",
              }}
            >
              <SendIcon
                size={16}
                color={hasInput && !isRunning ? "#ffffff" : isDark ? "#4B5563" : "#9CA3AF"}
              />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
