import { useThread, type ToolActivity } from "@openuidev/react-headless";
import clsx from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MarkDownRenderer } from "../MarkDownRenderer";
import { TimelineEntry } from "../_shared/tool-renderer/TimelineEntry";
import type { ToolDetailedViewPanel } from "../_shared/tool-renderer/ToolActivityRenderer";
import { defaultLabel } from "./ToolCallPrimitives";

/**
 * One display row of the timeline: a tool activity, or a thinking-text step
 * (prose the model emitted alongside its tool calls), in run order.
 */
export type TimelineStep =
  { type: "text"; id: string; text: string } | { type: "activity"; activity: ToolActivity };

const stepKey = (step: TimelineStep) =>
  step.type === "text" ? `text-${step.id}` : step.activity.id;

const TimelineStepRow = ({
  step,
  isLast,
  detailedViewPanel,
  forceDefault,
}: {
  step: TimelineStep;
  isLast: boolean;
  detailedViewPanel?: ToolDetailedViewPanel;
  forceDefault: boolean;
}) => {
  if (step.type === "text") {
    return (
      <div className="openui-tool-call-timeline__text-step">
        <MarkDownRenderer
          textMarkdown={step.text}
          className="openui-tool-call-timeline__text-step-body"
        />
      </div>
    );
  }
  return (
    <TimelineEntry
      activity={step.activity}
      isLast={isLast}
      detailedViewPanel={detailedViewPanel}
      forceDefault={forceDefault}
    />
  );
};

const REVEAL_INTERVAL = 600;

const NO_FADE: { top: boolean; bottom: boolean } = { top: false, bottom: false };

// scrollHeight and clientHeight are both rounded, and rows have fractional
// heights (line-height on a 14px body), so a list that fits can still report a
// pixel or two of overflow. Only a gap wider than that — and, per edge, a real
// scroll offset — counts, or a short run fades an edge it never scrolls past.
const OVERFLOW_SLACK = 8;
const EDGE_SLACK = 4;

/** Visually hidden but available to screen readers; inline so we don't depend on
 *  scss (a sibling agent owns the stylesheet). */
const VISUALLY_HIDDEN = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
  padding: 0,
  margin: -1,
} as const;

const isRunning = (a: ToolActivity) => a.status === "streaming" || a.status === "executing";

/**
 * The "Working / Behind the scenes" timeline wrapper, driven by
 * {@link ToolActivity}[] from `useToolActivities`. Reveals the run's steps
 * one-by-one and keeps every revealed one on screen, holds the tray open across
 * the tool-result → first-token gap (`awaitingResponse`), and lets a manual
 * close stick for the rest of the run. "Running" is read from each activity's
 * status, not an `isThinking` prop.
 *
 * (Animations are CSS-only — framer-motion is intentionally not a dependency.)
 *
 * @category Components
 */
export function ToolCallTimeline({
  activities,
  steps,
  isLast = false,
  detailedViewPanel,
  forceDefault = false,
  awaitingResponse = false,
}: {
  activities: ToolActivity[];
  /** Ordered display rows interleaving thinking text with tool activities */
  steps?: TimelineStep[];
  isLast?: boolean;
  detailedViewPanel?: ToolDetailedViewPanel;
  /** Render every row as the raw default card (e.g. so matched tools' raw
   *  request/response stay inspectable here while their rich preview renders elsewhere). */
  forceDefault?: boolean;
  /** Hold the compact "Working…" tray open across the tool-result → first-token
   *  gap instead of collapsing the instant the last result lands. */
  awaitingResponse?: boolean;
}) {
  const displaySteps: TimelineStep[] =
    steps ?? activities.map((activity) => ({ type: "activity", activity }));
  // "Thinking" while the last activity is still running (or its results are in
  // but the response hasn't started), on the live message, and the thread is
  // actually running — so a closed-args call with no result stops showing
  // "Working..." once the run ends.
  const isThreadRunning = useThread((s) => s.isRunning);
  const thinking =
    isThreadRunning &&
    isLast &&
    activities.length > 0 &&
    (isRunning(activities[activities.length - 1]!) || awaitingResponse);

  const [expanded, setExpanded] = useState(false);
  // A user close mid-run sticks until the next run.
  const [userCollapsed, setUserCollapsed] = useState(false);
  // Live message reveals from the first step; historical reveals them all so
  // it never animates "Working…" on mount.
  const [revealedCount, setRevealedCount] = useState(() =>
    isLast ? 1 : Math.max(displaySteps.length, 1),
  );

  // Reset on each run edge: a rising `thinking` restarts the reveal and clears
  // any prior expand/collapse; a falling `thinking` reveals everything.
  const prevThinking = useRef(thinking);
  useEffect(() => {
    if (!prevThinking.current && thinking) {
      setRevealedCount(1);
      setExpanded(false);
      setUserCollapsed(false);
      followRef.current = true;
    } else if (prevThinking.current && !thinking) {
      setExpanded(false);
      setRevealedCount(displaySteps.length);
    }
    prevThinking.current = thinking;
  }, [thinking, displaySteps.length]);

  // The items list is height-capped (see toolCall.scss) and scrolls
  // internally. While the run is live, SMOOTHLY follow the newest row as
  // content streams in — unless the user scrolled up to read an earlier one.
  const itemsRef = useRef<HTMLDivElement | null>(null);
  const followRef = useRef(true);
  const distanceFromBottom = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight;

  const [fade, setFade] = useState(NO_FADE);
  const measureEdges = useCallback(() => {
    const el = itemsRef.current;
    const next =
      el && el.scrollHeight - el.clientHeight > OVERFLOW_SLACK
        ? { top: el.scrollTop > EDGE_SLACK, bottom: distanceFromBottom(el) > EDGE_SLACK }
        : NO_FADE;
    setFade((prev) => (prev.top === next.top && prev.bottom === next.bottom ? prev : next));
  }, []);
  // Measured on every render of THIS component, which covers rows streaming in —
  // but a row expanding or collapsing is the child's own state, so the list can
  // grow past its cap and drop back under it without the timeline re-rendering
  // at all. Observing the element covers that: its box is content-sized until
  // the cap, so it changes on the way in and on the way back out.
  const observerRef = useRef<ResizeObserver | null>(null);
  const attachItems = useCallback(
    (el: HTMLDivElement | null) => {
      itemsRef.current = el;
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!el || typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(() => measureEdges());
      observer.observe(el);
      observerRef.current = observer;
    },
    [measureEdges],
  );
  useEffect(() => () => observerRef.current?.disconnect(), []);
  useLayoutEffect(() => {
    measureEdges();
  });

  const itemsClassName = clsx("openui-behind-the-scenes__items", {
    "openui-behind-the-scenes__items--fade-top": fade.top,
    "openui-behind-the-scenes__items--fade-bottom": fade.bottom,
  });

  const handleItemsScroll = useCallback(() => {
    const el = itemsRef.current;
    if (el && distanceFromBottom(el) < 24) followRef.current = true;
    measureEdges();
  }, [measureEdges]);
  const handleItemsWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaY < 0) followRef.current = false;
  }, []);
  const handleItemsTouchMove = useCallback(() => {
    const el = itemsRef.current;
    if (el && distanceFromBottom(el) >= 24) followRef.current = false;
  }, []);

  useLayoutEffect(() => {
    if (!thinking || !followRef.current) return;
    const el = itemsRef.current;
    if (!el || distanceFromBottom(el) < 1) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  });

  // Advance the reveal once the current step is ready — an activity whose args
  // have closed (left "streaming"); text steps are always ready. Only the live
  // message reveals incrementally.
  const revealingStep = displaySteps[revealedCount - 1];
  const currentReady =
    !revealingStep || revealingStep.type === "text"
      ? true
      : revealingStep.activity.status !== "streaming";
  useEffect(() => {
    if (isLast && revealedCount < displaySteps.length && currentReady) {
      const t = setTimeout(() => setRevealedCount((c) => c + 1), REVEAL_INTERVAL);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isLast, displaySteps.length, revealedCount, currentReady]);

  // Robustness: once the thread stops running, reveal everything. The
  // incremental reveal only advances while `isLast`, so a run that ends
  // mid-reveal (or a tray that mounted after `thinking` already fell) would
  // otherwise stay stuck showing "Working…". This is independent of the
  // rising/falling `thinking` edge, so it settles regardless of mount timing.
  useEffect(() => {
    if (!isThreadRunning && revealedCount < displaySteps.length) {
      setRevealedCount(displaySteps.length);
    }
  }, [isThreadRunning, revealedCount, displaySteps.length]);

  // Guard the array that is actually indexed below. `steps` is caller-supplied
  // and can be empty even when `activities` is not, and `??` keeps an empty
  // array rather than falling back to `activities`.
  if (activities.length === 0 || displaySteps.length === 0) return null;

  const revealing = revealedCount < displaySteps.length;
  const showCompact = (thinking || revealing) && !expanded && !userCollapsed;
  const isOpen = expanded || showCompact;
  const current = displaySteps[Math.min(revealedCount - 1, displaySteps.length - 1)]!;

  // Persistent live announcement reflecting the current step's status — driven by
  // the same fallback the primitives use so SRs hear status changes as content
  // updates (the keyed reveal wrapper remounts and never announces on its own).
  const liveLabel =
    current.type === "text"
      ? current.text
      : (current.activity.statusMessage ??
        defaultLabel(current.activity.status, current.activity.toolName));

  // Once settled, surface a failure count on the toggle so errors aren't hidden
  // behind a collapsed "Behind the scenes".
  const settled = !thinking && !revealing;
  const failedCount = settled ? activities.filter((a) => a.status === "error").length : 0;
  const working = thinking || revealing;
  const toggleLabel = working
    ? "Working"
    : failedCount > 0
      ? `Behind the scenes · ${failedCount} failed`
      : "Behind the scenes";

  return (
    <div className="openui-behind-the-scenes">
      <div role="status" aria-live="polite" style={VISUALLY_HIDDEN}>
        {liveLabel}
      </div>

      <button
        className="openui-behind-the-scenes__toggle"
        type="button"
        aria-expanded={isOpen}
        onClick={() => {
          // Anything open → close it (sticky for the rest of the run via
          // userCollapsed); otherwise reopen the full list.
          if (isOpen) {
            setExpanded(false);
            setUserCollapsed(true);
          } else {
            setExpanded(true);
          }
        }}
      >
        <span
          className={clsx("openui-behind-the-scenes__toggle-label", {
            // While the run is live the label itself shimmers, matching the
            // running tool rows below it.
            "openui-behind-the-scenes__toggle-label--shimmer": working,
          })}
        >
          {toggleLabel}
        </span>
        {isOpen ? (
          <ChevronUp size={14} className="openui-behind-the-scenes__toggle-icon" />
        ) : (
          <ChevronDown size={14} className="openui-behind-the-scenes__toggle-icon" />
        )}
      </button>

      {isLast && !expanded && (
        <div
          className={clsx("openui-behind-the-scenes__compact", {
            "openui-behind-the-scenes__compact--closed": !showCompact,
          })}
          inert={!showCompact}
        >
          <div className="openui-behind-the-scenes__compact-inner">
            {/* All revealed steps ACCUMULATE (scrollable past the cap) — each
                new step appends and only IT animates in (keyed by stepKey, so
                prior rows stay mounted). Showing one card at a time here made
                the tray look like it reopened on every step. */}
            <div
              className={itemsClassName}
              ref={attachItems}
              onScroll={handleItemsScroll}
              onWheel={handleItemsWheel}
              onTouchMove={handleItemsTouchMove}
            >
              {/* The run accumulates: every revealed step stays on screen and only
                  the newest is `isLast`, so just that one shimmers and blinks.
                  Keyed per step, so each row plays the fade-in once, on mount. */}
              {displaySteps.slice(0, revealedCount).map((step, idx) => (
                <div
                  key={stepKey(step)}
                  className="openui-behind-the-scenes__reveal-item"
                  style={{ width: "100%" }}
                >
                  <TimelineStepRow
                    step={step}
                    isLast={idx === revealedCount - 1}
                    detailedViewPanel={detailedViewPanel}
                    forceDefault={forceDefault}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {expanded && (
        <div
          className={itemsClassName}
          ref={attachItems}
          onScroll={handleItemsScroll}
          onWheel={handleItemsWheel}
          onTouchMove={handleItemsTouchMove}
        >
          {displaySteps.map((step, idx) => (
            <div key={stepKey(step)} style={{ width: "100%" }}>
              <TimelineStepRow
                step={step}
                isLast={isLast && idx === displaySteps.length - 1}
                detailedViewPanel={detailedViewPanel}
                forceDefault={forceDefault}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
