import { useArtifactRenderer, useThread, type ToolActivity } from "@openuidev/react-headless";
import { memo } from "react";
import { TimelineToolCard } from "../../ToolCall/TimelineToolCard";
import { ToolActivityRenderer, type ToolDetailedViewPanel } from "./ToolActivityRenderer";

export interface TimelineEntryProps {
  activity: ToolActivity;
  /** Whether this entry belongs to the live (last assistant) message — drives the running shimmer. */
  isLast?: boolean;
  /** Show the in-progress look (animated glyph, shimmer) whatever the status. */
  inProgress?: boolean;
  /** Optional detailed-view panel for matched renderers (defaults to the shared one). */
  detailedViewPanel?: ToolDetailedViewPanel;
  /** Always render the raw default card, even when a renderer matches (used for the "Behind the scenes" raw view). */
  forceDefault?: boolean;
  /**
   * When a matched renderer's parser returns null, fall back to the raw default
   * card (default `true`). Set `false` when a separate raw card already covers
   * this call (e.g. OpenUIChat shows the raw card in its forceDefault timeline),
   * to avoid rendering the raw card twice.
   */
  fallbackToDefault?: boolean;
  /** Controlled expand state for the default card (e.g. a one-open-at-a-time list). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const propsEqual = (a: TimelineEntryProps, b: TimelineEntryProps) =>
  a.activity.status === b.activity.status &&
  a.activity.toolCall.function.arguments === b.activity.toolCall.function.arguments &&
  a.activity.result === b.activity.result &&
  a.activity.isError === b.activity.isError &&
  a.isLast === b.isLast &&
  a.inProgress === b.inProgress &&
  a.forceDefault === b.forceDefault &&
  a.fallbackToDefault === b.fallbackToDefault &&
  a.detailedViewPanel === b.detailedViewPanel &&
  a.open === b.open &&
  a.onOpenChange === b.onOpenChange;

/**
 * Timeline-flavoured sibling of {@link ToolCallEntry}: the same matched-renderer
 * **xor** default dispatch, but the default is the timeline-shaped
 * {@link TimelineToolCard} (glyph + label row) instead of the chevron card. Used
 * both inside `<ToolCallTimeline>` and directly by flat threads that want the
 * always-visible timeline rows.
 *
 * @category Components
 */
export const TimelineEntry = memo(function TimelineEntry({
  activity,
  isLast = false,
  inProgress,
  detailedViewPanel,
  forceDefault = false,
  fallbackToDefault = true,
  open,
  onOpenChange,
}: TimelineEntryProps) {
  const renderer = useArtifactRenderer(activity.toolName); // exact → RegExp → "*"
  // Run-gate the in-progress animation: a closed-args call with no result must
  // not shimmer forever after the run ends (the status stays streaming/executing).
  const isRunning = useThread((s) => s.isRunning);
  const defaultCard = (
    <TimelineToolCard
      activity={activity}
      isLast={isLast}
      isRunning={isRunning}
      inProgress={inProgress}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
  if (forceDefault || !renderer) return defaultCard;
  // Matched renderer; if its parser returns null (skips), fall back to the raw
  // card so a tool call is never invisible mid-stream — unless a separate raw
  // card already covers it (fallbackToDefault=false).
  return (
    <ToolActivityRenderer
      renderer={renderer}
      activity={activity}
      detailedViewPanel={detailedViewPanel}
      fallback={fallbackToDefault ? defaultCard : null}
    />
  );
}, propsEqual);
