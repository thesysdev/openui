"use client";

import type { ArtifactBuildStep } from "@openuidev/react-headless";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import { useContext, useLayoutEffect, useRef, type ReactNode } from "react";
import { names, styles } from "./cloudArtifact.styles";
import { ContentConfigContext, useArtifactRenderer } from "./contexts";
import { feedNames, feedStyles as s } from "./statusPill.styles";

/*
 * The status pill: what a dashboard is doing, in a small pill over it. While it's built, the build
 * feed: one animated line saying what the build is doing now. "Thinking…", the calls running
 * ("Calling a and b…"), then "Building dashboard…" while it's written. While its data loads,
 * "Loading data…" (the `Loading` slot). `Dock` keeps the pill in view over the content.
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

/**
 * The line: a spinner while it calls tools (always, with `spinner`), the label, then the names.
 * It shimmers.
 */
export function BuildFeed({ className, spinner }: { className?: string; spinner?: boolean }) {
  const { label, detail, calling } = useFeedLine();
  return (
    <span className={clsx(s.line, feedNames.feed, className)} role="status">
      {(calling || spinner) && (
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

/** A small floating pill over the dashboard area. */
export function FeedPanel({ children }: { children: ReactNode }) {
  return <div className={clsx(s.panel, feedNames.panel)}>{children}</div>;
}

/** The feed over the dashboard area, in a small floating pill. */
export function BuildFeedPanel() {
  return (
    <FeedPanel>
      <BuildFeed spinner />
    </FeedPanel>
  );
}

/** The dock's glide from the middle to the bottom: quick to start, gentle to land. */
const GLIDE = "cubic-bezier(0.22, 1, 0.36, 1)";

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

/**
 * The part of an element on screen: its box, cut by each ancestor that clips it and by the window.
 * Whatever scrolls, the content or the page around it, this is what can be seen of it.
 */
function visibleBox(el: HTMLElement) {
  let { top, bottom, left, right } = el.getBoundingClientRect();
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(node);
    if (overflowX === "visible" && overflowY === "visible") continue;
    const box = node.getBoundingClientRect();
    top = Math.max(top, box.top + node.clientTop);
    bottom = Math.min(bottom, box.top + node.clientTop + node.clientHeight);
    left = Math.max(left, box.left + node.clientLeft);
    right = Math.min(right, box.left + node.clientLeft + node.clientWidth);
  }
  return {
    top: Math.max(top, 0),
    bottom: Math.min(bottom, window.innerHeight),
    left: Math.max(left, 0),
    right: Math.min(right, window.innerWidth),
  };
}

/**
 * A capsule over the content that stays in view, however the content or the page scrolls: in the
 * middle of what's visible until the content fills its top half, then at the bottom of what's
 * visible, over the content. Content that fills it already (an edit) starts there; so does one
 * `at="bottom"`. `delayed`: it rises in after a moment, so a quick one doesn't flash.
 */
export function Dock({
  children,
  delayed = false,
  at,
}: {
  children: ReactNode;
  delayed?: boolean;
  at?: "bottom";
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const spot = spotRef.current;
    const area = anchor?.parentElement;
    if (!anchor || !spot || !area) return;
    let docked = at === "bottom";
    let first = true;
    let settle = 0;
    const place = () => {
      const view = visibleBox(area);
      const middle = (view.top + view.bottom) / 2;
      if (!docked) {
        const end = area.getBoundingClientRect().top + contentEnd(area, anchor) - area.scrollTop;
        docked = end >= middle;
        if (docked) {
          // Growing content no longer moves it; size and scrolling still do.
          mutations?.disconnect();
          // Docked on arrival it just sits there; docked while watching, it glides down. The
          // transition is set with the move, and only for it: scrolling never animates.
          if (!first && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
            spot.style.transition = `top 0.5s ${GLIDE}, translate 0.5s ${GLIDE}`;
            settle = window.setTimeout(() => (spot.style.transition = ""), 550);
          }
        }
      }
      first = false;
      spot.style.visibility = view.bottom > view.top ? "" : "hidden";
      spot.style.left = `${view.left}px`;
      spot.style.width = `${Math.max(view.right - view.left, 0)}px`;
      spot.style.top = `${docked ? view.bottom : middle}px`;
      spot.style.translate = docked ? "0 calc(-100% - var(--openui-space-m))" : "0 -50%";
    };
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
    const mutations =
      docked || typeof MutationObserver === "undefined" ? null : new MutationObserver(place);
    resize?.observe(area);
    mutations?.observe(area, { childList: true, subtree: true, characterData: true });
    window.addEventListener("scroll", place, { capture: true, passive: true });
    window.addEventListener("resize", place);
    place();
    return () => {
      resize?.disconnect();
      mutations?.disconnect();
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
      window.clearTimeout(settle);
    };
  }, [at]);
  return (
    <div ref={anchorRef} className={s.dock}>
      <div ref={spotRef} className={clsx(s.dockSpot, delayed && s.delayed)}>
        {children}
      </div>
    </div>
  );
}
