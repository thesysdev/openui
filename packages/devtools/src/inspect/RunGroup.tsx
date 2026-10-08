import type { ObservabilityEvent } from "@openuidev/observability";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FONT, useStyles, type ThemeTokens } from "../theme";
import { LevelIcon } from "./LevelIcon";
import { runGroupLevel, runGroupTitle } from "./groupEvents";

export function RunGroup({
  events,
  defaultOpen,
  children,
}: {
  events: ObservabilityEvent[];
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const openedForError = useRef(defaultOpen && events.some((event) => event.level === "error"));
  const styles = useStyles(runGroupStyles);
  const level = runGroupLevel(events);
  const title = runGroupTitle(events);
  const newest = events[0];
  const hasError = events.some((event) => event.level === "error");

  useEffect(() => {
    if (!hasError || openedForError.current) return;
    openedForError.current = true;
    setOpen(true);
  }, [hasError]);

  return (
    <div style={styles.group} role="group" aria-label={title}>
      <button
        type="button"
        style={{ ...styles.header, ...(open ? null : { borderBottom: "none" }) }}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <LevelIcon level={level} />
        <span style={styles.title}>“{title}”</span>
        <span style={styles.headerRight}>
          {newest ? (
            <span style={styles.time}>{new Date(newest.timestamp).toLocaleTimeString()}</span>
          ) : null}
          <span style={styles.chevron} aria-hidden>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </span>
      </button>
      {open ? <div style={styles.body}>{children}</div> : null}
    </div>
  );
}

function runGroupStyles(t: ThemeTokens) {
  return {
    group: {
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: t.border,
      borderRadius: 12,
      background: t.card,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      width: "100%",
      border: "none",
      borderBottom: `1px solid ${t.border}`,
      background: t.bgMuted,
      color: "inherit",
      cursor: "pointer",
      fontFamily: FONT,
      padding: 12,
      textAlign: "left" as const,
    },
    title: {
      fontSize: 12,
      fontWeight: 600,
      color: t.fg,
      minWidth: 0,
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    headerRight: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginLeft: "auto",
      flexShrink: 0,
    },
    time: {
      color: t.fgFaint,
      fontSize: 11,
    },
    chevron: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 22,
      height: 22,
      flexShrink: 0,
      color: t.fgMuted,
    },
    body: {
      display: "flex",
      flexDirection: "column",
    },
  } satisfies Record<string, CSSProperties>;
}
