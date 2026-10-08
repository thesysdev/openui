import type { ToolActivity } from "@openuidev/react-headless";
import { ChevronRight } from "lucide-react";
import { memo } from "react";
import { SourceIcon } from "./SourceIcon";
import { ToolCall } from "./ToolCallPrimitives";
import { TIMELINE_GLYPH, toolIcon } from "./ToolGlyphs";
import { extractToolSources, type ToolResultSource } from "./toolSources";

/** Favicon + title rows for the links a tool's result carries (see
 *  {@link extractToolSources} — per-tool formats live in one registry). */
const ToolSources = ({ sources }: { sources: ToolResultSource[] }) => {
  return (
    <div className="openui-tool-call__sources">
      {sources.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="openui-tool-call__source"
        >
          <span className="openui-tool-call__source-left">
            <SourceIcon src={`https://www.google.com/s2/favicons?domain=${source.host}&sz=64`} />
            <span className="openui-tool-call__source-title">{source.title}</span>
          </span>
          <span className="openui-tool-call__source-desc">{source.siteName}</span>
        </a>
      ))}
    </div>
  );
};

/**
 * Timeline-shaped composition of the compound {@link ToolCall} parts: one row —
 * tool glyph, status label, chevron — that expands into either the result's
 * sources or a SINGLE block holding the request and the response together. The
 * running affordances (animated glyph, label shimmer) are
 * `(streaming|executing) && isLast`, derived from the lifecycle status rather
 * than a separate `isThinking` flag. `ToolCall.Root` is the single
 * `.openui-tool-call` container, so we compose *inside* it.
 *
 * @category Components
 */
export const TimelineToolCard = memo(function TimelineToolCard({
  activity,
  isLast,
  isRunning = true,
  inProgress,
  open,
  onOpenChange,
}: {
  activity: ToolActivity;
  isLast: boolean;
  /** Whether the owning thread is still running — gates the running shimmer/glyph
   *  animation so a closed-args call with no result doesn't animate forever after
   *  the run ends. */
  isRunning?: boolean;
  /** Show the in-progress look (animated glyph, shimmer) whatever the status — e.g.
   *  while a timeline is still on this step after a server-side tool already finished. */
  inProgress?: boolean;
  /** Controlled expand state; leave unset for the row to manage its own. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const Icon = toolIcon(activity.toolName, activity.status);
  const running =
    inProgress ??
    ((activity.status === "streaming" || activity.status === "executing") && isLast && isRunning);
  // Links speak for themselves; the raw block would only repeat them. A failure
  // always falls back to it, since that's where the error text lives.
  const sources =
    typeof activity.result === "string" && !activity.isError
      ? extractToolSources(activity.toolName, activity.result)
      : [];

  return (
    <ToolCall.Root
      activity={activity}
      isLast={isLast}
      running={isRunning}
      defaultOpen={activity.isError}
      open={open}
      onOpenChange={onOpenChange}
    >
      <ToolCall.Trigger className="openui-tool-call__title-row">
        <span className="openui-tool-call__icon-wrapper" data-status={activity.status}>
          <Icon {...TIMELINE_GLYPH} animate={running} className="openui-tool-call__icon" />
        </span>
        <ToolCall.StatusText
          render={(_state, props) => (
            <span
              // Announce tool-call status transitions (Calling → Running →
              // Called/failed) to assistive tech; only changes are spoken, so
              // settled/historical cards stay quiet.
              role="status"
              aria-live="polite"
              className={`openui-tool-call__name${
                running ? " openui-tool-call__name--shimmer" : ""
              }`}
            >
              {props["children"] as string}
            </span>
          )}
        />
        {/* Points right while closed and turns down when open (see toolCall.scss). */}
        <ChevronRight size={14} className="openui-tool-call__chevron" />
      </ToolCall.Trigger>

      <ToolCall.Content className="openui-tool-call__content">
        {sources.length > 0 ? (
          <ToolSources sources={sources} />
        ) : (
          // Request and response share one block; ToolCall.Result renders
          // nothing until a result or error lands.
          <pre className="openui-tool-call__block openui-tool-code-block__code">
            <ToolCall.Parameters render={(_s, p) => <code>{p["children"] as string}</code>} />
            <ToolCall.Result
              render={(s, p) => (
                <code
                  className={s.isError ? "openui-tool-code-block__code--error" : undefined}
                >{`\n\n${p["children"] as string}`}</code>
              )}
            />
          </pre>
        )}
      </ToolCall.Content>
    </ToolCall.Root>
  );
});
