"use client";

import { copyText } from "@/lib/copy-text";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./AgentPicker.module.css";

// Coding agents the create flow can install the OpenUI skill for. The first one
// is the anchor: it is always visible, and the rest slide out from under it.
// `slug` is the CLI's --agent-name value. `wideMark` is for marks drawn small in
// their own box, which need a nudge to sit at the same visual weight as the
// rest. `invertOnDark` is for marks drawn in near-black, which would disappear
// on the dark page; marks with colour of their own keep it on both themes.
/* What each agent button puts on the clipboard. A prompt to paste into an
   agent, not a shell command: it is copied verbatim, with nothing appended. */
export const AGENT_SETUP_PROMPT =
  "Visit OpenUI.com/docs and set up my first Generative UI agent using the recommended OpenUI stack.";

export const AGENTS = [
  {
    id: "claude",
    label: "Claude",
    mark: "https://cdn.simpleicons.org/claude",
    wideMark: false,
    invertOnDark: false,
  },
  {
    id: "cursor",
    label: "Cursor",
    mark: "https://cdn.simpleicons.org/cursor",
    wideMark: false,
    invertOnDark: true,
  },
  {
    id: "codex",
    label: "Codex",
    mark: "/brand-icons/openai.svg",
    wideMark: true,
    invertOnDark: true,
  },
] as const;

const COPY_FEEDBACK_MS = 1800;

function AgentButton({
  agent,
  command,
  onCopy,
}: {
  agent: (typeof AGENTS)[number];
  command: string;
  onCopy?: (command: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = async () => {
    if (!(await copyText(command))) return;
    onCopy?.(command);
    setCopied(true);
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    resetTimeoutRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={styles.option}
      aria-label={`Copy the setup prompt for ${agent.label}`}
      /* data-tip rather than title: the styled tooltip below reads it, and the
         native one would otherwise show up alongside it. aria-label already
         carries the accessible name. */
      data-tip="Copy prompt"
    >
      {copied ? (
        <Check size={18} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={`${styles.mark} ${agent.wideMark ? styles.markWide : ""} ${
            agent.invertOnDark ? styles.markInvert : ""
          }`
            .replace(/\s+/g, " ")
            .trim()}
          src={agent.mark}
          alt=""
          aria-hidden="true"
          width={20}
          height={20}
        />
      )}
    </button>
  );
}

/**
 * A row of circular agent buttons. Only the first is visible at rest; hovering
 * the group slides the others out from under it, to the right by default or to
 * the left where the row sits against the edge of its container.
 *
 * Driven by CSS :hover rather than state, so the extras stay out while the
 * pointer is on them (hover propagates from a descendant to its ancestor).
 */
export function AgentPicker({
  command,
  className = "",
  direction = "right",
  compact = false,
  onCopy,
}: {
  command: string;
  className?: string;
  direction?: "left" | "right";
  compact?: boolean;
  onCopy?: (command: string) => void;
}) {
  return (
    <div
      className={`${styles.picker} ${direction === "left" ? styles.pickerLeft : ""} ${
        compact ? styles.pickerCompact : ""
      } ${className}`
        .replace(/\s+/g, " ")
        .trim()}
    >
      {AGENTS.map((agent) => (
        <AgentButton key={agent.id} agent={agent} command={command} onCopy={onCopy} />
      ))}
    </div>
  );
}
