import { useThread, type ToolActivity } from "@openuidev/react-headless";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Mascot } from "../AgentInterface/components/Mascot";
import { MarkDownRenderer } from "../MarkDownRenderer";
import { TimelineEntry } from "../_shared/tool-renderer/TimelineEntry";
import type { ToolDetailedViewPanel } from "../_shared/tool-renderer/ToolActivityRenderer";
import { defaultLabel } from "./ToolCallPrimitives";
import { TIMELINE_GLYPH, ThinkingGlyph, toolIcon } from "./ToolGlyphs";
import { useToolLabels } from "./toolLabels";

/**
 * One display row of the timeline: a tool activity, or a thinking-text step
 * (prose the model emitted alongside its tool calls), in run order.
 */
export type TimelineStep =
  { type: "text"; id: string; text: string } | { type: "activity"; activity: ToolActivity };

const stepKey = (step: TimelineStep) =>
  step.type === "text" ? `text-${step.id}` : step.activity.id;

const isRunning = (a: ToolActivity) => a.status === "streaming" || a.status === "executing";

/**
 * A thinking-text step as a timeline row: brain glyph and label, expanding into
 * the prose. Same markup and classes as {@link TimelineToolCard}'s row, so the
 * two line up and share styles.
 */
const ThoughtRow = ({
  text,
  live,
  open,
  onOpenChange,
}: {
  text: string;
  /** This is the step the run is on right now. */
  live: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const triggerId = useId();
  const panelId = useId();
  return (
    <div className="openui-tool-call openui-tool-call--thought">
      <button
        type="button"
        id={triggerId}
        className="openui-tool-call__title-row"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
      >
        <span className="openui-tool-call__icon-wrapper">
          <ThinkingGlyph {...TIMELINE_GLYPH} animate={live} className="openui-tool-call__icon" />
        </span>
        <span
          className={clsx("openui-tool-call__name", { "openui-tool-call__name--shimmer": live })}
        >
          {live ? "Thinking" : "Thought it through"}
        </span>
        <ChevronRight size={14} className="openui-tool-call__chevron" />
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="openui-tool-call__content"
        >
          <MarkDownRenderer
            textMarkdown={text}
            className="openui-tool-call-timeline__text-step-body"
          />
        </div>
      )}
    </div>
  );
};

const TimelineStepRow = ({
  step,
  isLast,
  live,
  detailedViewPanel,
  forceDefault,
  open,
  onOpenChange,
}: {
  step: TimelineStep;
  isLast: boolean;
  /** The newest step while the run is live: shown in progress whatever its status. */
  live: boolean;
  detailedViewPanel?: ToolDetailedViewPanel;
  forceDefault: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  if (step.type === "text") {
    return <ThoughtRow text={step.text} live={live} open={open} onOpenChange={onOpenChange} />;
  }
  return (
    <TimelineEntry
      activity={step.activity}
      isLast={isLast}
      inProgress={live || undefined}
      detailedViewPanel={detailedViewPanel}
      forceDefault={forceDefault}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
};

/**
 * What the collapsed header shows for the step in progress: its glyph and label,
 * animated for as long as the step holds the header (server-side tools can
 * finish before the reveal reaches them, so the status alone isn't enough).
 */
const LiveStepSummary = ({ step }: { step: TimelineStep }) => {
  const labels = useToolLabels();
  if (step.type === "text") {
    return (
      <>
        <span className="openui-behind-the-scenes__glyph">
          <ThinkingGlyph {...TIMELINE_GLYPH} animate />
        </span>
        <span className="openui-behind-the-scenes__toggle-label openui-behind-the-scenes__toggle-label--shimmer">
          Thinking
        </span>
      </>
    );
  }
  const { activity } = step;
  const Glyph = toolIcon(activity.toolName, activity.status);
  const label = activity.statusMessage ?? defaultLabel(activity.status, activity.toolName, labels);
  return (
    <>
      <span className="openui-behind-the-scenes__glyph">
        <Glyph {...TIMELINE_GLYPH} animate />
      </span>
      <span className="openui-behind-the-scenes__toggle-label openui-behind-the-scenes__toggle-label--shimmer">
        {label}
      </span>
    </>
  );
};

/**
 * The timeline's header in its "Working" state, on its own: the mascot and a
 * shimmering label. The thread shows it from the moment a message is sent
 * until a tool call or the answer arrives, and it sits exactly where the
 * timeline's header will, so the hand-over doesn't move anything.
 */
export const TimelineWorkingIndicator = () => (
  <div className="openui-behind-the-scenes">
    <div
      className="openui-behind-the-scenes__toggle openui-behind-the-scenes__toggle--static"
      role="status"
    >
      <span className="openui-behind-the-scenes__ticker">
        <span className="openui-behind-the-scenes__ticker-item">
          <span className="openui-behind-the-scenes__glyph">
            <Mascot size={28} className="openui-behind-the-scenes__mascot" />
          </span>
          <span className="openui-behind-the-scenes__toggle-label openui-behind-the-scenes__toggle-label--shimmer">
            Working
          </span>
        </span>
      </span>
    </div>
  </div>
);

/** Keep in sync with the ticker animation duration in toolCall.scss. */
const TICKER_SLIDE_MS = 320;

/**
 * One line of header content. When `itemKey` changes, the previous line slides
 * up and out while the new one slides up into place.
 */
const HeaderTicker = ({ itemKey, children }: { itemKey: string; children: ReactNode }) => {
  const [leaving, setLeaving] = useState<{ key: string; node: ReactNode } | null>(null);
  const last = useRef({ key: itemKey, node: children });

  useEffect(() => {
    if (last.current.key === itemKey) return;
    setLeaving(last.current);
    const t = setTimeout(() => setLeaving(null), TICKER_SLIDE_MS);
    return () => clearTimeout(t);
  }, [itemKey]);

  // Remember what is on screen now, so the next change can slide it out.
  useEffect(() => {
    last.current = { key: itemKey, node: children };
  });

  return (
    <span className="openui-behind-the-scenes__ticker">
      {leaving && (
        <span
          key={`out-${leaving.key}`}
          className="openui-behind-the-scenes__ticker-item openui-behind-the-scenes__ticker-item--out"
          aria-hidden="true"
        >
          {leaving.node}
        </span>
      )}
      <span
        key={itemKey}
        className={clsx("openui-behind-the-scenes__ticker-item", {
          "openui-behind-the-scenes__ticker-item--in": leaving,
        })}
      >
        {children}
      </span>
    </span>
  );
};

// How long each step holds the header before the next one slides in.
const REVEAL_INTERVAL = 1000;

const NO_FADE: { top: boolean; bottom: boolean } = { top: false, bottom: false };

// scrollHeight and clientHeight are both rounded, and rows have fractional
// heights (line-height on a 14px body), so a list that fits can still report a
// pixel or two of overflow. Only a gap wider than that — and, per edge, a real
// scroll offset — counts, or a short run fades an edge it never scrolls past.
const OVERFLOW_SLACK = 8;
const EDGE_SLACK = 4;

/** Visually hidden but available to screen readers. */
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

/**
 * The "Working / Behind the scenes" timeline, driven by {@link ToolActivity}[]
 * from `useToolActivities`.
 *
 * - **Header.** Collapsed while a run is live, it shows the step in progress
 *   (its animated glyph and label), and each new step slides the previous one
 *   up and out. Otherwise it shows the mascot with "Working" or "Behind the
 *   scenes".
 * - **List.** Expanding shows every revealed step as rows in one card. One row
 *   is open at a time.
 *
 * Steps are revealed one by one at a readable pace, the run counts as live
 * across the tool-result → first-token gap (`awaitingResponse`), and "running"
 * is read from each activity's status rather than an `isThinking` prop.
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
  /** Keep the run "live" across the tool-result → first-token gap instead of
   *  settling the instant the last result lands. */
  awaitingResponse?: boolean;
}) {
  const displaySteps: TimelineStep[] =
    steps ?? activities.map((activity) => ({ type: "activity", activity }));
  // "Thinking" while the last activity is still running (or its results are in
  // but the response hasn't started), on the live message, and the thread is
  // actually running — so a closed-args call with no result stops showing
  // "Working" once the run ends.
  const isThreadRunning = useThread((s) => s.isRunning);
  const labels = useToolLabels();
  const thinking =
    isThreadRunning &&
    isLast &&
    activities.length > 0 &&
    (isRunning(activities[activities.length - 1]!) || awaitingResponse);

  // Collapsed by default; the header carries the live step instead.
  const [expanded, setExpanded] = useState(false);
  // The one open row in the list, by step key.
  const [openStep, setOpenStep] = useState<string | null>(null);
  // Live message reveals from the first step; historical reveals them all so
  // it never animates "Working" on mount.
  const [revealedCount, setRevealedCount] = useState(() =>
    isLast ? 1 : Math.max(displaySteps.length, 1),
  );

  // Reset on each run edge: a rising `thinking` restarts the reveal and
  // collapses the list; a falling `thinking` reveals everything.
  const prevThinking = useRef(thinking);
  useEffect(() => {
    if (!prevThinking.current && thinking) {
      setRevealedCount(1);
      setExpanded(false);
      setOpenStep(null);
      followRef.current = true;
    } else if (prevThinking.current && !thinking) {
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
  // but a row expanding or collapsing changes the list's height too, and so
  // does the list opening. Observing the element covers those: its box is
  // content-sized until the cap, so it changes on the way in and back out.
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
    if (!thinking || !expanded || !followRef.current) return;
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
  // mid-reveal (or a timeline that mounted after `thinking` already fell)
  // would otherwise stay stuck showing "Working". This is independent of the
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
  const working = thinking || revealing;
  const current = displaySteps[Math.min(revealedCount - 1, displaySteps.length - 1)]!;
  // Collapsed while live, the header shows the newest revealed step until the
  // run settles; open, the list shows it instead.
  const liveStep = working && !expanded ? current : null;

  // Persistent live announcement reflecting the current step's status — driven by
  // the same fallback the primitives use so SRs hear status changes as content
  // updates (the header ticker remounts its line and never announces on its own).
  const liveLabel =
    current.type === "text"
      ? current.text
      : (current.activity.statusMessage ??
        defaultLabel(current.activity.status, current.activity.toolName, labels));

  // Once settled, surface a failure count on the toggle so errors aren't hidden
  // behind a collapsed "Behind the scenes".
  const failedCount = working ? 0 : activities.filter((a) => a.status === "error").length;
  const toggleLabel = working
    ? "Working"
    : failedCount > 0
      ? `Behind the scenes · ${failedCount} failed`
      : "Behind the scenes";

  return (
    <div
      className={clsx("openui-behind-the-scenes", {
        // While working, the mascot in this row stands in for the thread loader.
        "openui-behind-the-scenes--working": working,
        // Once the run is over, the header steps back (see toolCall.scss).
        "openui-behind-the-scenes--settled": !working,
      })}
    >
      <div role="status" aria-live="polite" style={VISUALLY_HIDDEN}>
        {liveLabel}
      </div>

      <button
        className="openui-behind-the-scenes__toggle"
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
      >
        <HeaderTicker itemKey={liveStep ? stepKey(liveStep) : "summary"}>
          {liveStep ? (
            <LiveStepSummary step={liveStep} />
          ) : (
            <>
              <span className="openui-behind-the-scenes__glyph">
                <Mascot size={28} className="openui-behind-the-scenes__mascot" />
              </span>
              <span
                className={clsx("openui-behind-the-scenes__toggle-label", {
                  "openui-behind-the-scenes__toggle-label--shimmer": working,
                })}
              >
                {toggleLabel}
              </span>
            </>
          )}
        </HeaderTicker>
        {/* Points right while collapsed and turns down when open (see toolCall.scss). */}
        <ChevronRight size={16} className="openui-behind-the-scenes__toggle-icon" />
      </button>

      <div
        className={clsx("openui-behind-the-scenes__collapse", {
          "openui-behind-the-scenes__collapse--open": expanded,
        })}
        inert={!expanded}
      >
        <div className="openui-behind-the-scenes__collapse-inner">
          <div
            className={clsx("openui-behind-the-scenes__items", {
              "openui-behind-the-scenes__items--fade-top": fade.top,
              "openui-behind-the-scenes__items--fade-bottom": fade.bottom,
            })}
            ref={attachItems}
            onScroll={handleItemsScroll}
            onWheel={handleItemsWheel}
            onTouchMove={handleItemsTouchMove}
          >
            {/* Keyed per step, so each new row plays its fade-in once, on mount. */}
            {displaySteps.slice(0, revealedCount).map((step, idx) => {
              const key = stepKey(step);
              const newest = idx === revealedCount - 1;
              return (
                <div key={key} className="openui-behind-the-scenes__item">
                  <TimelineStepRow
                    step={step}
                    isLast={isLast && newest}
                    live={working && newest}
                    detailedViewPanel={detailedViewPanel}
                    forceDefault={forceDefault}
                    open={openStep === key}
                    onOpenChange={(open) => setOpenStep(open ? key : null)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
