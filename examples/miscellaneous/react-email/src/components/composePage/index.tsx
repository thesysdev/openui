"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import { Send as SendIcon } from "lucide-react";
import { useState } from "react";
import { STARTERS } from "./starters";

export function ComposePage({ onSend }: { onSend: (message: string) => void }) {
  const [input, setInput] = useState("");
  const isDark = true;
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: isMobile ? "16px" : "24px",
        gap: isMobile ? "24px" : "32px",
        backgroundColor: isDark ? "#0a0a0a" : "#fafafa",
        overflow: "auto",
      }}
    >
      {/* Heading */}
      <div style={{ textAlign: "center", maxWidth: isMobile ? "100%" : undefined }}>
        <h1
          style={{
            fontSize: isMobile ? "28px" : "48px",
            fontWeight: 700,
            color: isDark ? "#f5f5f5" : "#111827",
            margin: "0 0 12px 0",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          AI email generator
        </h1>
        <p
          style={{
            fontSize: isMobile ? "14px" : "17px",
            color: isDark ? "#9CA3AF" : "#6B7280",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {isMobile
            ? "Turn a prompt into a complete email template."
            : "Turn a simple prompt into a complete email template with layout, copy, and CTAs included."}
        </p>
      </div>

      {/* Conversation starters — responsive grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: isMobile ? "8px" : "12px",
          maxWidth: "700px",
          width: "100%",
        }}
      >
        {STARTERS.map((starter) => (
          <button
            key={starter.prompt}
            onClick={() => onSend(starter.prompt)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "space-between",
              padding: isMobile ? "12px" : "16px",
              minHeight: isMobile ? "100px" : "140px",
              borderRadius: isMobile ? "12px" : "16px",
              border: `1px solid ${isDark ? "#222" : "#e5e7eb"}`,
              backgroundColor: isDark ? "#111111" : "#ffffff",
              cursor: "pointer",
              transition: "border-color 0.2s, transform 0.15s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = isDark ? "#444" : "#d1d5db";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDark ? "#222" : "#e5e7eb";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: isMobile ? 28 : 36,
                height: isMobile ? 28 : 36,
                borderRadius: isMobile ? "8px" : "10px",
                backgroundColor: isDark ? starter.iconBg : "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? "14px" : "18px",
                marginBottom: isMobile ? "10px" : "16px",
              }}
            >
              {starter.icon}
            </div>
            <span
              style={{
                fontSize: isMobile ? "12px" : "14px",
                fontWeight: 500,
                color: isDark ? "#e5e7eb" : "#111827",
                lineHeight: "1.4",
              }}
            >
              {starter.displayText}
            </span>
          </button>
        ))}
      </div>

      {/* Textarea input */}
      <form
        onSubmit={handleSubmit}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "700px",
        }}
      >
        <div
          style={{
            borderRadius: isMobile ? "12px" : "16px",
            border: `1px solid ${isDark ? "#1f1f1f" : "#e5e7eb"}`,
            backgroundColor: isDark ? "#111111" : "#ffffff",
            overflow: "hidden",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isMobile
                ? "Describe the email you want..."
                : `Create a product launch email for our new [product], highlight 3 key features, and add a "Shop now" button.`
            }
            rows={isMobile ? 3 : 4}
            style={{
              width: "100%",
              padding: isMobile ? "14px 14px 40px 14px" : "20px 20px 48px 20px",
              fontSize: isMobile ? "14px" : "15px",
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
              const container = e.currentTarget.parentElement;
              if (container) {
                container.style.borderColor = "#5F51E8";
                container.style.boxShadow = isDark
                  ? "0 0 0 1px #5F51E8"
                  : "0 0 0 3px rgba(95, 81, 232, 0.1)";
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
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "0 10px 10px 10px",
            }}
          >
            <button
              type="submit"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                backgroundColor: input.trim() ? "#5F51E8" : isDark ? "#1a1a1a" : "#f3f4f6",
                cursor: input.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s",
              }}
            >
              <SendIcon
                size={16}
                color={input.trim() ? "#ffffff" : isDark ? "#4B5563" : "#9CA3AF"}
              />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
