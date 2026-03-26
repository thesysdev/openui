"use client";

interface MobileTabToggleProps {
  isDark: boolean;
  mobileTab: "html" | "preview";
  onTabChange: (tab: "html" | "preview") => void;
}

export function MobileTabToggle({ isDark, mobileTab, onTabChange }: MobileTabToggleProps) {
  return (
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
      {(["html", "preview"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          style={{
            flex: 1,
            padding: "8px",
            fontSize: "13px",
            fontWeight: 600,
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backgroundColor:
              mobileTab === tab ? (isDark ? "#1a1a2e" : "#EEF2FF") : "transparent",
            color:
              mobileTab === tab
                ? isDark
                  ? "#818cf8"
                  : "#5F51E8"
                : isDark
                  ? "#6B7280"
                  : "#9CA3AF",
            transition: "all 0.15s",
          }}
        >
          {tab.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
