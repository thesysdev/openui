import { observability, type ObservabilityEvent } from "@openuidev/observability";
import { Check, Copy, ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { withDevtoolsAttribution } from "../lib/links";
import { FONT, MONO, useStyles, type ThemeTokens } from "../theme";
import type { DevtoolsPosition } from "../types";
import { IconButton } from "./IconButton";

const COMMAND = "npx @openuidev/cli@latest deploy";
const DEPLOY_DOCS_URL = "https://www.openui.com/docs/api-reference/cli#deploy";

const SEEN_KEY = "openui:deploy-hint:v1";
const BANNER_DISMISSED_KEY = "openui:deploy-banner-dismissed:v1";

/** Local eligibility only, not a hosted-response analytics event or a business-success signal. */
function isCompletedLocalResponse(event: ObservabilityEvent): boolean {
  const detail = event.detail;
  const parser = detail["parser"] as Record<string, unknown> | undefined;
  return (
    event.level === "info" &&
    detail["kind"] === "react-lang:stream" &&
    detail["phase"] === "settled" &&
    typeof detail["response"] === "string" &&
    detail["response"].trim().length > 0 &&
    Array.isArray(detail["errors"]) &&
    detail["errors"].length === 0 &&
    parser?.["incomplete"] === false &&
    Array.isArray(parser["unresolved"]) &&
    parser["unresolved"].length === 0 &&
    typeof parser["statementCount"] === "number" &&
    parser["statementCount"] > 0
  );
}

/** A once-per-origin nudge. No prompts, responses or identity leave this browser. */
export function DeployHint({ position, hidden }: { position: DevtoolsPosition; hidden: boolean }) {
  const [visible, setVisible] = useState(false);
  const shown = useRef(false);
  const styles = useStyles(hintStyles);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SEEN_KEY)) return;
    } catch {
      // Suppress rather than repeatedly nudging when persistence is unavailable.
      return;
    }
    return observability.listenAll((event) => {
      if (
        shown.current ||
        hidden ||
        document.visibilityState === "hidden" ||
        !isCompletedLocalResponse(event)
      )
        return;
      try {
        if (window.localStorage.getItem(SEEN_KEY)) return;
        window.localStorage.setItem(SEEN_KEY, "seen");
      } catch {
        return;
      }
      shown.current = true;
      setVisible(true);
    });
  }, [hidden]);

  if (!visible || hidden) return null;
  const placement = {
    [position.startsWith("top") ? "top" : "bottom"]: 68,
    [position.endsWith("left") ? "left" : "right"]: 16,
  };

  return (
    <aside aria-label="Deploy your OpenUI app" style={{ ...styles.card, ...placement }}>
      <div style={styles.heading}>
        <strong>Ready to share your app?</strong>
        <IconButton
          type="button"
          aria-label="Dismiss deployment hint"
          title="Dismiss deployment hint"
          style={styles.dismiss}
          onClick={() => setVisible(false)}
        >
          <X size={14} aria-hidden />
        </IconButton>
      </div>
      <p style={styles.description}>
        Deploy from your project folder to your Vercel account.{" "}
        <a
          href={withDevtoolsAttribution(DEPLOY_DOCS_URL, "local_deploy_hint")}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}
        >
          Deployment docs ↗
        </a>
      </p>
      <DeployCommand />
    </aside>
  );
}

function hintStyles(t: ThemeTokens) {
  return {
    card: {
      position: "fixed",
      zIndex: 2147483646,
      boxSizing: "border-box",
      width: "min(360px, calc(100vw - 32px))",
      maxHeight: "calc(100vh - 100px)",
      overflowY: "auto",
      border: `1px solid ${t.borderStrong}`,
      borderRadius: 12,
      padding: 16,
      background: t.bg,
      color: t.fg,
      boxShadow: t.shadow,
      fontFamily: FONT,
      fontSize: 13,
    },
    heading: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 4,
    },
    dismiss: { flexShrink: 0 },
    description: { margin: "0 0 12px", lineHeight: 1.5, color: t.fgSecondary },
    link: { color: t.fg, textDecoration: "underline" },
  } satisfies Record<string, CSSProperties>;
}

/** Dismissible discovery inside Inspect, independent of the one-time popup. */
export function DeployBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(BANNER_DISMISSED_KEY) !== null;
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(BANNER_DISMISSED_KEY, "dismissed");
    } catch {
      // Still close for this mount when browser storage is unavailable.
    }
  };

  if (dismissed) return null;
  return (
    <section aria-label="Deploy your OpenUI app" style={{ flexShrink: 0 }}>
      <DeployCommand compact onDismiss={dismiss} />
    </section>
  );
}

/** Shared clipboard control. Copying never executes the command or sends analytics. */
function DeployCommand({
  compact = false,
  onDismiss,
}: {
  compact?: boolean;
  onDismiss?: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [docsHovered, setDocsHovered] = useState(false);
  const styles = useStyles(commandStyles);

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(COMMAND);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <div>
      <div style={{ ...styles.row, ...(compact ? styles.compactRow : null) }}>
        <code style={{ ...styles.command, ...(compact ? styles.compactCommand : null) }}>
          {COMMAND}
        </code>
        {compact ? (
          <a
            href={withDevtoolsAttribution(DEPLOY_DOCS_URL, "inspect_deploy_banner")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Deployment docs"
            title="Deployment docs"
            style={{ ...styles.docsLink, ...(docsHovered ? styles.docsLinkHover : null) }}
            onMouseEnter={() => setDocsHovered(true)}
            onMouseLeave={() => setDocsHovered(false)}
          >
            <ExternalLink size={14} aria-hidden />
          </a>
        ) : null}
        {compact ? (
          <IconButton
            type="button"
            aria-label="Copy deploy command"
            title="Copy deploy command"
            style={styles.iconButton}
            onClick={copyCommand}
          >
            {status === "copied" ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          </IconButton>
        ) : (
          <button
            type="button"
            aria-label="Copy deploy command"
            title="Copy deploy command"
            style={styles.button}
            onClick={copyCommand}
          >
            {status === "copied" ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
          </button>
        )}
        {onDismiss ? (
          <IconButton
            type="button"
            aria-label="Dismiss deployment banner"
            title="Dismiss deployment banner"
            style={styles.iconButton}
            onClick={onDismiss}
          >
            <X size={14} aria-hidden />
          </IconButton>
        ) : null}
      </div>
      <span
        role="status"
        style={
          compact && status !== "failed"
            ? styles.visuallyHidden
            : status === "idle"
              ? undefined
              : styles.status
        }
      >
        {status === "failed"
          ? "Copy failed. Select the command to copy it manually."
          : status === "copied"
            ? "Copied. Run it in a terminal from your project folder."
            : ""}
      </span>
    </div>
  );
}

function commandStyles(t: ThemeTokens) {
  return {
    row: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      paddingLeft: 10,
      background: t.bgSubtle,
    },
    command: {
      flex: 1,
      minWidth: 0,
      userSelect: "all",
      overflowWrap: "anywhere",
      color: t.fg,
      fontFamily: MONO,
      fontSize: 12,
      lineHeight: 1.5,
    },
    compactCommand: { fontSize: 11 },
    compactRow: {
      gap: 4,
      padding: "6px 8px 6px 12px",
      borderRadius: 12,
      background: t.card,
      boxShadow: t.shadowSubtle,
    },
    iconButton: { flexShrink: 0 },
    docsLink: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      width: 26,
      height: 26,
      borderRadius: 8,
      color: t.fgMuted,
      transition: "background 150ms ease, color 150ms ease",
    },
    docsLinkHover: { background: t.bgSubtle, color: t.fg },
    button: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      width: 44,
      height: 44,
      border: `1px solid ${t.controlBorder}`,
      borderRadius: 7,
      background: t.inverted,
      color: t.invertedFg,
      cursor: "pointer",
    },
    visuallyHidden: {
      position: "absolute",
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      overflow: "hidden",
      clipPath: "inset(50%)",
      whiteSpace: "nowrap",
      border: 0,
    },
    status: {
      display: "block",
      marginTop: 8,
      color: t.fgSecondary,
      fontFamily: FONT,
      fontSize: 12,
      lineHeight: 1.5,
    },
  } satisfies Record<string, CSSProperties>;
}
