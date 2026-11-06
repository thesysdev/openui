"use client";

import { copyText } from "@/lib/copy-text";
import { Check, CheckCheck, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./AgentPicker.module.css";

/* What the button puts on the clipboard. A prompt to paste into an agent, not
   a shell command: it is copied verbatim, with nothing appended. */
export const AGENT_SETUP_PROMPT = `Set up my first Generative UI agent using the recommended OpenUI stack.

1. Scaffold: run \`npx @openuidev/cli@latest create\`. It runs without prompts, creates the project folder, and installs dependencies.
2. Tell me if there are any steps required of me to complete.
3. First message: start the app, open its local URL, send one message, and tell me what the server log actually returned.`;

/* The Gateway page's prompt: the same scaffold, pointed at the Gateway docs. */
export const GATEWAY_SETUP_PROMPT = `Set up my first Generative UI agent using OpenUI gateway  ([openui.com/docs/gateway](http://openui.com/docs/gateway)).

1. Scaffold: run \`npx @openuidev/cli@latest create\`. It runs without prompts, creates the project folder, and installs dependencies.
2. Tell me if there are any steps required for me to complete the setup.
3. Then run the dev server



Read the AGENTS.md for the instructions to work with OpenUI`;

/* The Dashboards page's prompt: the dashboards example, and its docs. */
export const DASHBOARDS_SETUP_PROMPT = `Set up agent with Generative UI dashboards using the OpenUI ([openui.com/docs/dashboards](http://openui.com/docs/dashboards)).

1. Scaffold: run \`npx @openuidev/cli@latest create --example assistant-ui-dashboards\`. It runs without prompts, creates the project folder, and installs dependencies.
2. Go through the Readme of the scaffold.
3. Tell me if there are any steps required for me to complete the setup.
4. ensure to run the dev server



Read the AGENTS.md for the instructions to work with OpenUI`;

// The coding agents the prompt is written for; their marks ride along after
// the label. `wideMark` is for marks drawn small in their own box, which need
// a nudge to sit at the same visual weight as the rest. `inkMark` is for marks
// drawn in near-black, which would disappear on the black pill; marks with
// colour of their own keep it on both themes.
export const AGENTS = [
  {
    id: "claude",
    label: "Claude",
    mark: "https://cdn.simpleicons.org/claude",
    wideMark: false,
    inkMark: false,
  },
  {
    id: "codex",
    label: "Codex",
    mark: "/brand-icons/openai.svg",
    wideMark: true,
    inkMark: true,
  },
  {
    id: "cursor",
    label: "Cursor",
    mark: "https://cdn.simpleicons.org/cursor",
    wideMark: false,
    inkMark: true,
  },
] as const;

const COPY_FEEDBACK_MS = 1800;

/* The hand-run path beside the button: the same create command, one row per
   package runner. The spec matches the hero command pill's. */
const CLI_RUNNERS = ["pnpx", "bunx", "yarn dlx", "npx"] as const;
const CLI_SPEC = "@openuidev/cli@latest create";

/**
 * The hero's agent CTA: one primary pill that copies the setup prompt, with
 * the marks of the agents it is written for after the label. Primary is
 * theme-inverted, in BevelButton's language: black on the light page, white
 * on the dark one.
 */
export function AgentPicker({
  command,
  className = "",
  onCopy,
  runner = true,
}: {
  command: string;
  className?: string;
  onCopy?: (command: string) => void;
  /* The "Build with pnpx" pairing; product pages show the agent button alone. */
  runner?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [copiedRunner, setCopiedRunner] = useState<string | null>(null);
  const [hoveredRunner, setHoveredRunner] = useState<string | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runnerResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      if (runnerResetTimeoutRef.current) {
        clearTimeout(runnerResetTimeoutRef.current);
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

  const handleRunnerCopy = async (runner: string) => {
    if (!(await copyText(`${runner} ${CLI_SPEC}`))) return;
    setCopiedRunner(runner);
    if (runnerResetTimeoutRef.current) {
      clearTimeout(runnerResetTimeoutRef.current);
    }
    runnerResetTimeoutRef.current = setTimeout(() => setCopiedRunner(null), COPY_FEEDBACK_MS);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${styles.build} ${className}`.trim()}
        aria-label="Copy the setup prompt for your coding agent"
        /* Drives the tooltip's copied message; the button itself holds still. */
        data-copied={copied || undefined}
      >
        <span className={styles.label}>Setup for agents</span>
        <span className={styles.marks} aria-hidden="true">
          {AGENTS.map((agent) => (
            <span key={agent.id} className={styles.markRing} data-agent={agent.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={`${styles.mark} ${agent.wideMark ? styles.markWide : ""} ${
                  agent.inkMark ? styles.markInk : ""
                }`
                  .replace(/\s+/g, " ")
                  .trim()}
                src={agent.mark}
                alt={`${agent.label} logo`}
                width={14}
                height={14}
              />
            </span>
          ))}
        </span>
        {/* The tooltip: what a click does, then the next step once copied. */}
        <span className={styles.tip} aria-hidden="true">
          <span className={styles.tipIcon}>
            <Copy className={styles.tipCopy} size={13} strokeWidth={2} />
            <CheckCheck className={styles.tipCheck} size={14} strokeWidth={2.5} />
          </span>
          {copied ? "Paste prompt in agent" : "Copy prompt for agent"}
        </span>
      </button>
      {/* The hand-run pairing: the same shape as the agent button, with the
          runner where the facepile sits. Desktop only; the mobile stack
          orders the two differently. Hovering opens the other runners, each
          row copying its create command. */}
      {runner ? (
        <span className={styles.runnerWrap}>
          <button
            type="button"
            className={styles.alt}
            aria-haspopup="menu"
            onClick={() => handleRunnerCopy("pnpx")}
          >
            <span className={styles.label}>Build with</span>
            <span className={styles.runnerPill}>
              {/* Keyed, so a hovered row's runner slides in from below. */}
              <span key={hoveredRunner ?? "pnpx"} className={styles.runnerName}>
                {hoveredRunner ?? "pnpx"}
              </span>
            </span>
          </button>
          <div className={styles.runnerMenu} onMouseLeave={() => setHoveredRunner(null)}>
            <div className={styles.runnerCard} role="menu" aria-label="Copy the create command">
              {CLI_RUNNERS.map((runner) => (
                <button
                  key={runner}
                  type="button"
                  role="menuitem"
                  className={styles.runnerItem}
                  onClick={() => handleRunnerCopy(runner)}
                  onMouseEnter={() => setHoveredRunner(runner)}
                >
                  <span>
                    <strong>{runner}</strong> {CLI_SPEC}
                  </span>
                  <Check
                    className={`${styles.runnerCheck} ${
                      copiedRunner === runner ? styles.runnerCheckShown : ""
                    }`.trim()}
                    size={14}
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>
        </span>
      ) : null}
    </>
  );
}
