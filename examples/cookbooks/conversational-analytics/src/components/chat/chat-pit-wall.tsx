"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CarSilhouette } from "../f1-assets";
import { Chevron } from "./icons";
import { f1ToolLabel, ToolIcon } from "./tool-icons";
import "./chat.css";

/*
 * ChatPitWall: what the engineers did before answering. Each OpenF1 lookup is
 * one uppercase line with a marshal flag (yellow while it runs, green when done,
 * red when it failed) and the tool's icon. Thinking between lookups sits in the
 * same list as muted italic lines. It stays folded unless you open it: while
 * the run is live the header rolls to each new step's icon and line, and once
 * it's done a car drives across the header, clearing the last step and
 * revealing the chequered flag and PIT WALL behind it.
 */

export type PitWallStatus = "running" | "done" | "error";

export type PitWallToolStep = {
  kind?: "tool";
  id: string;
  /** The OpenF1 tool that ran, e.g. "get_lap_times". Picks the icon. */
  tool: string;
  /** Uppercase line, e.g. "Lap times · Miami 2024 · NOR, VER". */
  message: string;
  /** Muted second line. Shown only when the check failed, to say why. */
  detail?: string;
  status: PitWallStatus;
};

export type PitWallThinkingStep = {
  kind: "thinking";
  id: string;
  /** The model's reasoning between lookups, in plain sentences. */
  text: string;
};

export type PitWallStep = PitWallToolStep | PitWallThinkingStep;

export type ChatPitWallProps = {
  steps: PitWallStep[];
  /** True while the run is going. The header rolls through each step as it arrives. */
  live?: boolean;
  defaultOpen?: boolean;
  label?: string;
};

// Three slanted blocks: someone on the pit wall working it out.
function ThinkingIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden fill="currentColor" style={{ flex: "none" }}>
      <g transform="skewX(-12) translate(2.5 0)">
        <path d="M2 10h4.5v4.5H2zM9.75 10h4.5v4.5h-4.5zM17.5 10H22v4.5h-4.5z" />
      </g>
    </svg>
  );
}

const FINISH_MS = 1000;

const isTool = (s: PitWallStep): s is PitWallToolStep => s.kind !== "thinking";

// One step in the header: its icon and its line.
function Step({ step, className, live = false }: { step: PitWallStep; className: string; live?: boolean }) {
  const tool = isTool(step);
  return (
    <span className={className} data-thinking={tool ? undefined : true}>
      <span className="f1c-rc__icon">{tool ? <ToolIcon tool={step.tool} live={live} /> : <ThinkingIcon />}</span>
      <span className="f1c-rc__now-text">{tool ? step.message : step.text}</span>
    </span>
  );
}

export function ChatPitWall({ steps, live = false, defaultOpen = false, label = "Pit wall" }: ChatPitWallProps) {
  const tools = steps.filter(isTool);
  const failed = tools.filter((s) => s.status === "error").length;
  // Folded by default, live or not. Only the reader opens it.
  const [open, setOpen] = useState(defaultOpen);
  const listId = useId();
  // Live to done: the car runs once across the header. Reduced motion skips it (the CSS collapses it to an instant swap).
  const [finishing, setFinishing] = useState(false);
  const wasLive = useRef(live);
  useEffect(() => {
    if (!wasLive.current || live) {
      wasLive.current = live;
      return;
    }
    wasLive.current = false;
    setFinishing(true);
    const t = setTimeout(() => setFinishing(false), FINISH_MS);
    return () => clearTimeout(t);
  }, [live]);
  // Only rows that arrive after mount get the entrance, so history never animates.
  const [seen] = useState(() => new Set(steps.map((s) => s.id)));

  if (!steps.length) return null;
  const latest = steps[steps.length - 1];

  return (
    <div className="f1c f1c-rc" data-open={open || undefined}>
      <button type="button" className="f1c-rc__head" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)}>
        {live ? (
          <>
            <span className="f1c-flag f1c-flag--head" data-status="running" />
            {/* Live: the current step. Keyed by step, so each new one rolls up into place. */}
            <span className="f1c-rc__now" aria-live="polite">
              <Step key={latest.id} step={latest} className="f1c-rc__roll" live />
            </span>
          </>
        ) : (
          <span className="f1c-rc__done" data-reveal={finishing || undefined}>
            <span className="f1c-flag f1c-flag--head" data-status={failed ? "error" : "chequered"} />
            <span className="f1c-label">{label}</span>
            {/* Only speaks when something failed. */}
            <span className="f1c-rc__summary" data-failed={failed ? true : undefined}>
              {failed ? `${failed} flagged` : null}
            </span>
          </span>
        )}
        {finishing && (
          // The last step, swept away by the car as it passes.
          <span className="f1c-rc__track" aria-hidden>
            <Step step={latest} className="f1c-rc__outgoing" />
            <span className="f1c-rc__car">
              <CarSilhouette width={56} />
            </span>
          </span>
        )}
        <Chevron />
      </button>
      <div className="f1c-rc__body">
        <ol id={listId} className="f1c-rc__list">
          {steps.map((s) => {
            const fresh = seen.has(s.id) ? undefined : true;
            return isTool(s) ? (
              <li key={s.id} className="f1c-rc__step" data-status={s.status} data-new={fresh}>
                <span className="f1c-flag" data-status={s.status} aria-label={s.status} />
                <span className="f1c-rc__icon" title={f1ToolLabel(s.tool)}>
                  <ToolIcon tool={s.tool} live={live && s.status === "running"} />
                </span>
                <span className="f1c-rc__msg">{s.message}</span>
                {s.status === "error" && s.detail && <span className="f1c-rc__detail">{s.detail}</span>}
              </li>
            ) : (
              <li key={s.id} className="f1c-rc__step f1c-rc__step--thinking" data-new={fresh}>
                <span />
                <span className="f1c-rc__icon" title="Thinking">
                  <ThinkingIcon />
                </span>
                <span className="f1c-rc__thought">{s.text}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
