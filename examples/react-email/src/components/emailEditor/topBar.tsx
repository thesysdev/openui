"use client";

import { Mail as MailIcon, Plus as PlusIcon } from "lucide-react";

interface TopBarProps {
  isDark: boolean;
  isMobile: boolean;
  isRunning: boolean;
  onNewEmail: () => void;
}

export function TopBar({ isDark, isMobile, isRunning, onNewEmail }: TopBarProps) {
  return (
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
        {isRunning && <GeneratingIndicator isDark={isDark} isMobile={isMobile} />}
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
          e.currentTarget.style.backgroundColor = isDark ? "#1a1a2e" : "#EEF2FF";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isDark ? "#1f1f1f" : "#e5e7eb";
          e.currentTarget.style.backgroundColor = isDark ? "#111111" : "#ffffff";
        }}
      >
        <PlusIcon size={isMobile ? 16 : 14} color={isDark ? "#e5e7eb" : "#374151"} />
        {!isMobile && "New Email"}
      </button>
    </div>
  );
}

function GeneratingIndicator({ isDark, isMobile }: { isDark: boolean; isMobile: boolean }) {
  if (isMobile) {
    return (
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
    );
  }

  return (
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
  );
}
