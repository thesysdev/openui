"use client";

import clsx from "clsx";
import { ChevronRight, CodeXml, LoaderCircle, Wrench } from "lucide-react";
import { useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { feedNames, feedStyles as s } from "./buildFeed.styles";
import {
  callTime,
  isBuildActive,
  runningCalls,
  stepWords,
  type ArtifactBuild,
  type BuildCall,
} from "./buildTracker";
import { names, styles } from "./cloudArtifact.styles";

/*
 * What a build is doing, the same in the card and over the dashboard. Collapsed, one line:
 * "Thinking…", the calls running now ("Calling a and b…"), "Building dashboard…", then how it
 * ended, with the build's time on the right. Opened, every call, newest first, with what it took.
 */

// One clock for every timer on the page, so the card and the panel never show different seconds.
let second = 0;
const tickers = new Set<() => void>();
let ticking: ReturnType<typeof setInterval> | undefined;
function onTick(listener: () => void) {
  tickers.add(listener);
  if (ticking === undefined) {
    second = Math.floor(Date.now() / 1000);
    ticking = setInterval(() => {
      second = Math.floor(Date.now() / 1000);
      tickers.forEach((ticker) => ticker());
    }, 250);
  }
  return () => {
    tickers.delete(listener);
    if (!tickers.size) {
      clearInterval(ticking);
      ticking = undefined;
    }
  };
}
const noTick = () => () => {};

/** Seconds the build has run, or ran. Null before the page has a clock (the server render). */
function useElapsed(build: ArtifactBuild): number | null {
  const active = isBuildActive(build);
  const now = useSyncExternalStore(
    active ? onTick : noTick,
    () => second,
    () => 0,
  );
  const end = build.endedAt !== undefined ? build.endedAt / 1000 : now;
  return end ? Math.max(0, Math.floor(end - build.startedAt / 1000)) : null;
}

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** "44s", or "1m 12s". */
const duration = (seconds: number) =>
  seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

/** "503ms", "1.3s", "1m 4s". */
const callDuration = (ms: number) =>
  ms < 1000
    ? `${Math.round(ms)}ms`
    : ms < 60_000
      ? `${(ms / 1000).toFixed(1)}s`
      : duration(Math.round(ms / 1000));

/** "7 tool calls, 4 scripts". Empty for a build that made none. */
function callSummary(build: ArtifactBuild): string {
  const count = (kind: BuildCall["kind"]) =>
    build.calls.filter((call) => call.kind === kind).reduce((sum, call) => sum + call.count, 0);
  const part = (n: number, word: string) => (n ? `${n} ${word}${n === 1 ? "" : "s"}` : "");
  return [part(count("tool"), "tool call"), part(count("script"), "script")]
    .filter(Boolean)
    .join(", ");
}

/** Why it failed, without repeating the label: "Couldn't create the dashboard: X" → "X". */
function reason(error: string | undefined): string | undefined {
  const rest = error
    ?.replace(
      /^Couldn['’]t (build|create|update|change|edit) (the|this) (dashboard|artifact)[:.]?\s*/i,
      "",
    )
    .trim();
  return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : undefined;
}

interface Status {
  label: string;
  detail?: string;
  /** Running: it shimmers. */
  live: boolean;
  spinner?: boolean;
  danger?: boolean;
}

function feedStatus(build: ArtifactBuild, noun: string | undefined): Status {
  const summary = callSummary(build) || undefined;
  switch (build.phase) {
    case "thinking": {
      const running = runningCalls(build);
      const names = (kind: BuildCall["kind"]) =>
        running.filter((call) => call.kind === kind).map((call) => call.name);
      const words = stepWords({ tools: names("tool"), scripts: names("script") });
      if (!words) return { label: "Thinking…", live: true };
      return { label: words.verb, detail: `${words.names}…`, live: true, spinner: true };
    }
    case "building":
      return {
        label: noun ? `${build.edit ? "Updating" : "Building"} ${noun}…` : "Generating…",
        detail: summary,
        live: true,
      };
    case "ready":
      return { label: build.edit ? "Updated" : "Ready", detail: summary, live: false };
    case "stopped":
      return { label: "Stopped", detail: summary, live: false };
    case "failed":
      return {
        label: build.edit ? "Couldn't update" : "Couldn't build",
        detail: summary,
        live: false,
        danger: true,
      };
  }
}

function Timer({ build }: { build: ArtifactBuild }) {
  const elapsed = useElapsed(build);
  if (elapsed === null) return null;
  return (
    <span className={clsx(s.time, feedNames.time)}>
      {isBuildActive(build) ? clock(elapsed) : duration(elapsed)}
    </span>
  );
}

const Spinner = () => (
  <LoaderCircle className={clsx(styles.spinner, names.spinner)} size={14} aria-hidden />
);

/** The first line. With calls to show, it's a button that opens and closes them. */
function Line({
  build,
  noun,
  open,
  onToggle,
}: {
  build: ArtifactBuild;
  noun?: string;
  open: boolean;
  onToggle: () => void;
}) {
  const status = feedStatus(build, noun);
  const canOpen = build.calls.length > 0;
  const content = (
    <>
      {status.spinner && <Spinner />}
      <span className={clsx(s.words, status.live && s.shimmer)}>
        <span
          className={clsx(
            s.label,
            feedNames.label,
            status.danger ? s.danger : status.live && s.live,
          )}
        >
          {status.label}
        </span>
        {status.detail && (
          <span className={clsx(s.detail, feedNames.detail)} title={status.detail}>
            {status.detail}
          </span>
        )}
      </span>
      {canOpen && (
        <ChevronRight size={12} aria-hidden className={clsx(s.chevron, open && s.chevronOpen)} />
      )}
      <Timer build={build} />
    </>
  );
  // Nothing to open: plain text, so a click on it reaches the card under it.
  if (!canOpen) return <span className={clsx(s.line, feedNames.line)}>{content}</span>;
  return (
    <button
      type="button"
      className={clsx(s.line, s.toggle, feedNames.line)}
      aria-expanded={open}
      onClick={(event) => {
        // In a card that opens on click: open the list, not the card.
        event.stopPropagation();
        onToggle();
      }}
    >
      {content}
    </button>
  );
}

/** One call: its icon (a spinner while it runs), its name, and what it took. */
function CallRow({ build, call, live }: { build: ArtifactBuild; call: BuildCall; live: boolean }) {
  const ms = live ? undefined : callTime(build, call);
  return (
    <li className={clsx(s.call, feedNames.call)}>
      {live ? (
        <Spinner />
      ) : call.kind === "tool" ? (
        <Wrench size={14} aria-hidden />
      ) : (
        <CodeXml size={14} aria-hidden />
      )}
      <span className={clsx(s.words, live && s.shimmer)}>
        <span className={clsx(s.detail, live && s.live)} title={call.name}>
          {call.name}
        </span>
        {call.count > 1 && <span className={s.repeat}>×{call.count}</span>}
      </span>
      <span className={s.time}>{ms !== undefined ? callDuration(ms) : ""}</span>
    </li>
  );
}

/** Children at their natural height, with changes eased, so opening and growing don't jump. */
function SmoothHeight({ children }: { children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const element = inner.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    setHeight(element.offsetHeight);
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={s.smooth} style={height === null ? undefined : { height }}>
      <div ref={inner} className={s.smoothInner}>
        {children}
      </div>
    </div>
  );
}

export interface BuildFeedProps {
  build: ArtifactBuild;
  /** What's built, such as "dashboard". */
  noun?: string;
  className?: string;
}

/** The line and, once opened, the calls under it. */
export function BuildFeed({ build, noun, className }: BuildFeedProps) {
  const [open, setOpen] = useState(false);
  const show = open && build.calls.length > 0;
  const why = build.phase === "failed" ? reason(build.error) : undefined;
  const running = runningCalls(build);
  return (
    <div className={clsx(s.feed, feedNames.feed, className)} role="status">
      <Line build={build} noun={noun} open={show} onToggle={() => setOpen((value) => !value)} />
      {why && <p className={clsx(s.reason, feedNames.reason)}>{why}</p>}
      <SmoothHeight>
        {show && (
          <ul className={clsx(s.calls, feedNames.calls)} aria-label="Calls, newest first">
            {[...build.calls].reverse().map((call) => (
              <CallRow
                key={`${call.kind}:${call.name}`}
                build={build}
                call={call}
                live={running.includes(call)}
              />
            ))}
          </ul>
        )}
      </SmoothHeight>
    </div>
  );
}

/** The feed over the dashboard area, in a small floating card. */
export function BuildFeedPanel({ build, noun, className }: BuildFeedProps) {
  return (
    <div className={clsx(s.panel, feedNames.panel, className)}>
      <BuildFeed build={build} noun={noun} />
      {build.phase === "stopped" && (
        <p className={s.reason}>Stopped before anything was written. Ask again to build it.</p>
      )}
    </div>
  );
}
