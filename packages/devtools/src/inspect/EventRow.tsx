import { type ObservabilityErrorInfo, type ObservabilityEvent } from "@openuidev/observability";
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { FONT, MONO, useStyles, useTheme, type ThemeTokens } from "../theme";
import { displayEventKind } from "./groupEvents";
import { LevelIcon } from "./LevelIcon";
import { nestedRowBox } from "./rowBox";

export function EventRow({
  event,
  embedded = false,
  last = false,
}: {
  event: ObservabilityEvent;
  embedded?: boolean;
  last?: boolean;
}) {
  const styles = useStyles(eventRowStyles);
  const theme = useTheme();
  const error = getErrorInfo(event);
  const detail = asRecord(event.detail);
  const kind = asString(detail["kind"]);
  const status = typeof detail["status"] === "number" ? String(detail["status"]) : undefined;
  const message = error?.message ?? asString(detail["message"]);
  const summary = message ? null : kind ? null : summarize(event);
  const stack = error?.stack;
  const expandable = Boolean(stack);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const copyText = stack ?? "";
  const copyDetail = () => {
    if (!copyText || typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(copyText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  const header = (
    <>
      <div style={styles.rowHeader}>
        <div style={styles.badgeGroup}>
          <LevelIcon level={event.level} />
          {kind ? <span style={styles.kind}>{displayEventKind(kind)}</span> : null}
          {status ? (
            <span style={{ ...styles.badge, ...styles.badgeNeutral }}>{status}</span>
          ) : null}
        </div>
        <div style={styles.rowHeaderRight}>
          <span style={styles.time}>{new Date(event.timestamp).toLocaleTimeString()}</span>
          <span style={styles.chevron} aria-hidden>
            {expandable ? expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} /> : null}
          </span>
        </div>
      </div>
      {message ? <div style={styles.summary}>{message}</div> : null}
      {summary ? <div style={styles.summary}>{summary}</div> : null}
    </>
  );

  return (
    <div
      style={{
        ...styles.row,
        ...(embedded ? nestedRowBox(theme, last) : null),
        ...(expandable && hovered && !embedded ? styles.rowHover : null),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {expandable ? (
        <button
          type="button"
          style={styles.toggle}
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-label="Toggle stack trace"
        >
          {header}
        </button>
      ) : (
        header
      )}

      {expanded && stack ? (
        <div style={styles.expanded}>
          <pre style={styles.stack}>{stack}</pre>
          <div style={styles.actions}>
            <button type="button" style={styles.action} onClick={copyDetail}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function asRecord(detail: unknown): Record<string, unknown> {
  return typeof detail === "object" && detail !== null ? (detail as Record<string, unknown>) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getErrorInfo(event: ObservabilityEvent): ObservabilityErrorInfo | undefined {
  const error = asRecord(event.detail)["error"];
  if (typeof error === "object" && error !== null && "message" in error) {
    return error as ObservabilityErrorInfo;
  }
  return undefined;
}

function summarize(event: ObservabilityEvent): string {
  const detail = asRecord(event.detail);
  const error = getErrorInfo(event);
  const method = asString(detail["method"]);
  const url = asString(detail["url"]);
  const subject =
    asString(detail["kind"]) ??
    asString(detail["component"]) ??
    asString(detail["toolName"]) ??
    asString(detail["target"]) ??
    (url ? [method, url].filter(Boolean).join(" ") : undefined);
  const status = typeof detail["status"] === "number" ? `→ ${detail["status"]}` : undefined;
  const message = error ? `— ${error.message}` : asString(detail["message"]);

  const parts = [subject, status, message].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  try {
    const { runId: _runId, ...rest } = detail;
    return JSON.stringify(rest) ?? "(no detail)";
  } catch {
    return "(no detail)";
  }
}

function eventRowStyles(t: ThemeTokens) {
  return {
    row: {
      // Four longhands: `borderWidth` is a shorthand, and mixing it with
      // `borderBottomWidth` in the embedded override leaves a leftover box stroke.
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderStyle: "solid",
      borderColor: t.border,
      borderRadius: 12,
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 6,
      background: t.card,
      transition: "border-color 150ms ease, box-shadow 150ms ease",
    },
    rowHover: {
      borderColor: t.borderStrong,
      boxShadow: t.shadowSubtle,
    },
    toggle: {
      width: "100%",
      border: "none",
      background: "transparent",
      color: "inherit",
      cursor: "pointer",
      fontFamily: FONT,
      padding: 0,
      textAlign: "left",
    },
    rowHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
      minHeight: 22,
    },
    rowHeaderRight: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexShrink: 0,
    },
    chevron: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      width: 22,
      height: 22,
      flexShrink: 0,
      color: t.fgMuted,
    },
    badgeGroup: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      minWidth: 0,
    },
    kind: {
      color: t.fg,
      fontSize: 12,
      fontWeight: 600,
      wordBreak: "break-word",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "transparent",
      padding: "1px 8px",
      fontSize: 11,
      fontWeight: 500,
      fontFamily: FONT,
    },
    badgeNeutral: {
      background: t.bgSubtle,
      color: t.fgSecondary,
      borderColor: t.border,
      fontFamily: MONO,
    },
    time: {
      color: t.fgFaint,
      fontSize: 11,
    },
    summary: {
      wordBreak: "break-word",
      color: t.fgTertiary,
      fontSize: 12,
      lineHeight: 1.5,
      marginTop: 7,
      paddingLeft: 24,
    },
    expanded: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      marginTop: 4,
    },
    stack: {
      maxHeight: 260,
      overflow: "auto",
      margin: 0,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      background: t.bgMuted,
      color: t.fgTertiary,
      fontFamily: MONO,
      fontSize: 11,
      lineHeight: 1.5,
      padding: 10,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    actions: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
    },
    action: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      background: t.bg,
      color: t.fgSecondary,
      cursor: "pointer",
      fontFamily: FONT,
      fontSize: 11,
      fontWeight: 500,
      padding: "4px 9px",
    },
  } satisfies Record<string, CSSProperties>;
}
