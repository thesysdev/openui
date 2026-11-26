"use client";

import type { ArtifactBuildStep } from "@openuidev/react-headless";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import { useContext, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { feedNames, feedStyles as s } from "./buildFeed.styles";
import { names, styles } from "./cloudArtifact.styles";
import { ContentConfigContext, useArtifactRenderer } from "./contexts";

/*
 * The build feed: one animated line saying what the build is doing now. "Thinking…", the calls
 * running ("Calling a and b…"), then "Building dashboard…" while it's written. It goes when the
 * build's stream ends.
 */

/** A step's names, as they are: "a", "a and b", or "a, b and 2 more". */
const nameList = (names: string[]) =>
  names.length <= 2 ? names.join(" and ") : `${names[0]}, ${names[1]} and ${names.length - 2} more`;

/**
 * What a step does, by name: calling data tools, else writing and testing scripts. Undefined for
 * a step that has neither yet: the build has started.
 */
export const stepWords = (step: ArtifactBuildStep) =>
  step.tools.length > 0
    ? { verb: "Calling", names: nameList(step.tools) }
    : step.scripts.length > 0
      ? { verb: "Writing and testing", names: nameList(step.scripts) }
      : undefined;

/** The feed's line for the build on screen. */
function useFeedLine(): { label: string; detail?: string; calling: boolean } {
  const { step, isPending, isEditing } = useArtifactRenderer();
  const noun = useContext(ContentConfigContext)?.noun;
  const words = step && stepWords(step);
  if (words) return { label: words.verb, detail: `${words.names}…`, calling: true };
  if (step || isPending) return { label: "Thinking…", calling: false };
  const verb = isEditing ? "Updating" : "Building";
  return { label: noun ? `${verb} ${noun}…` : "Generating…", calling: false };
}

/** The line: a spinner while it calls tools, the label, then the names. It shimmers. */
export function BuildFeed({ className }: { className?: string }) {
  const { label, detail, calling } = useFeedLine();
  return (
    <span className={clsx(s.line, feedNames.feed, className)} role="status">
      {calling && (
        <LoaderCircle className={clsx(styles.spinner, names.spinner)} size={14} aria-hidden />
      )}
      <span className={s.shimmer}>
        <span className={clsx(s.label, feedNames.label)}>{label}</span>
        {detail && (
          <span className={clsx(s.detail, feedNames.detail)} title={detail}>
            {detail}
          </span>
        )}
      </span>
    </span>
  );
}

/** The feed over the dashboard area, in a small floating card. */
export function BuildFeedPanel() {
  return (
    <div className={clsx(s.panel, feedNames.panel)}>
      <BuildFeed />
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
export function DockedBuildFeed() {
  const anchorRef = useRef<HTMLDivElement>(null);
  const { docked, middle, moved } = useDockPlace(anchorRef);
  return (
    <div ref={anchorRef} className={s.dock}>
      <div
        className={clsx(s.dockSpot, docked && s.dockSpotDown, moved && s.dockSpotMoving)}
        style={docked ? undefined : { bottom: middle, translate: "0 50%" }}
      >
        <BuildFeedPanel />
      </div>
    </div>
  );
}
