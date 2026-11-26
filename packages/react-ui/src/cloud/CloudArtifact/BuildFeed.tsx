"use client";

import clsx from "clsx";
import { ChevronRight, CodeXml, LoaderCircle, Wrench } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { feedNames, feedStyles as s } from "./buildFeed.styles";
import {
  callTime,
  runningCalls,
  stepWords,
  type ArtifactBuild,
  type BuildCall,
} from "./buildTracker";
import { names, styles } from "./cloudArtifact.styles";

/*
 * What a build is doing, the same in the card and over the dashboard. Collapsed, one line:
 * "Thinking…", the calls running now ("Calling a and b…"), "Building dashboard…", then how it
 * ended. Opened, every call, newest first, with what it took.
 */

/** "503ms", "1.3s", "1m 4s". */
function callDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

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
      <span className={clsx(s.time, feedNames.time)}>
        {ms !== undefined ? callDuration(ms) : ""}
      </span>
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

/** How far down the area its content reaches (px): the bottom of its in-flow children. */
function contentEnd(area: HTMLElement, dock: HTMLElement): number {
  let end = 0;
  for (const child of area.children) {
    if (child === dock || !(child instanceof HTMLElement)) continue;
    const { position } = getComputedStyle(child);
    if (position === "absolute" || position === "fixed") continue;
    end = Math.max(end, child.offsetTop + child.offsetHeight);
  }
  return end;
}

interface DockPlace {
  /** At the bottom: the content fills the top half of what's visible. It stays there. */
  docked: boolean;
  /** Half the visible height (px), where the middle is. */
  middle: number;
  /** It moved down during the build, rather than starting at the bottom (an edit). */
  moved: boolean;
}

/** Where the docked feed sits, from the area it's in, measured as the content grows. */
function useDockPlace(anchorRef: RefObject<HTMLDivElement | null>): DockPlace {
  const [place, setPlace] = useState<DockPlace>({ docked: false, middle: 0, moved: false });
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const area = anchor?.parentElement;
    if (!anchor || !area) return;
    let first = true;
    const measure = () => {
      const middle = area.clientHeight / 2;
      const docked = contentEnd(area, anchor) >= middle;
      // Docked on arrival (an edit) it just sits there; docked while watching, it moves down.
      const moved = docked && !first;
      first = false;
      if (docked) stop();
      setPlace((current) =>
        docked
          ? { docked, middle, moved }
          : current.middle === middle
            ? current
            : { ...current, middle },
      );
    };
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    const mutations =
      typeof MutationObserver === "undefined" ? null : new MutationObserver(measure);
    const stop = () => {
      resize?.disconnect();
      mutations?.disconnect();
    };
    resize?.observe(area);
    mutations?.observe(area, { childList: true, subtree: true, characterData: true });
    measure();
    return stop;
  }, [anchorRef]);
  return place;
}

/**
 * The feed once the dashboard is on screen: in the middle of what's visible until the dashboard
 * fills its top half, then at the bottom, where it stays. An edit starts at the bottom.
 */
export function DockedBuildFeed({ build, noun }: BuildFeedProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const { docked, middle, moved } = useDockPlace(anchorRef);
  return (
    <div ref={anchorRef} className={s.dock}>
      <div
        className={clsx(s.dockSpot, docked && s.dockSpotDown, moved && s.dockSpotMoving)}
        style={docked ? undefined : { bottom: middle, translate: "0 50%" }}
      >
        <BuildFeedPanel build={build} noun={noun} />
      </div>
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
