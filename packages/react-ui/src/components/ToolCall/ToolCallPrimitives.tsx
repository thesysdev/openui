import type { ToolActivity, ToolCallStatus } from "@openuidev/react-headless";
import clsx from "clsx";
import { createContext, createElement, useContext, useId, useState, type ReactNode } from "react";
import { toolIcon } from "./ToolGlyphs";
import { toolLabel, useToolLabels, type ToolLabels } from "./toolLabels";

/**
 * Compound, reusable building blocks for rendering one tool call + its result.
 *
 * `ToolCall.Root` holds the typed {@link ToolActivity} and expand state in
 * context; the thin parts read it and expose typed `data-*` / `aria` attributes
 * plus a `render` escape hatch (Base-UI / Radix style) so a consumer can swap
 * the element or markup per place. The batteries-included `DefaultToolCard` /
 * `TimelineToolCard` are just two compositions of these parts — drop them into a
 * sidebar, a compact chip, or a debug panel and reuse the typed state without
 * re-deriving anything.
 *
 * @category Components
 */

// ── Context ──

interface ToolCallContextValue {
  activity: ToolActivity;
  isLast: boolean;
  /**
   * Whether the owning thread is still running. The in-progress affordances
   * (glyph animation, name shimmer) require this so a tool call that closed its args
   * but never received a result does NOT animate forever after the run ends.
   * Defaults to `true` for standalone (thread-less) primitive use.
   */
  running: boolean;
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  panelId: string;
  /** Stable id on the rendered Trigger button; names the Content region. */
  triggerId: string;
}

const ToolCallContext = createContext<ToolCallContextValue | null>(null);

/** Reads the nearest {@link ToolCall.Root} context. @category Hooks */
export function useToolCall(): ToolCallContextValue {
  const ctx = useContext(ToolCallContext);
  if (!ctx) throw new Error("ToolCall.* parts must be used inside <ToolCall.Root>");
  return ctx;
}

// ── render escape hatch ──

type RenderProp<State, Props> = (state: State, props: Props) => ReactNode;

/**
 * Renders the consumer's `render` prop if given, else the default element with
 * `defaultProps`, exposing the typed `state` to the render prop. Not a hook
 * (contains no hooks) despite slotting into component bodies.
 */
function renderPart<State, Props extends Record<string, unknown>>(
  render: RenderProp<State, Props> | undefined,
  tag: string,
  state: State,
  defaultProps: Props,
): ReactNode {
  if (render) return render(state, defaultProps);
  return createElement(tag, defaultProps);
}

const isRunning = (status: ToolCallStatus) => status === "streaming" || status === "executing";

// ── Shared label / formatting helpers ──

/**
 * Default human label for a status + tool name ("Searching the web", "Used
 * image search"); see {@link toolLabel} and {@link ToolLabelsProvider}.
 *
 * @category Functions
 */
export function defaultLabel(status: ToolCallStatus, name: string, overrides?: ToolLabels): string {
  return toolLabel(status, name, overrides);
}

/** Pretty-prints a JSON result string, falling back to the raw string. @category Functions */
export function prettyResult(value?: string): string {
  if (value == null) return "";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Pretty-prints any value (objects stringified, strings shown verbatim). */
function prettyValue(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * Resolves what to show in the request panel. Honors the deprecated `_request`
 * arg key (shows just that), and — when the parsed input is empty (unparseable
 * / earliest streaming frame) — falls back to the raw argument string so the
 * user sees the partial text instead of an empty `{}`.
 */
function resolveRequest(activity: ToolActivity): string {
  const input = activity.input;
  // `!= null` matches the legacy ToolCallComponent gating — a `_request: null`
  // is treated as absent, not as the request payload.
  if (isObject(input) && input["_request"] != null) return prettyValue(input["_request"]);
  if (isObject(input) && Object.keys(input).length === 0) {
    const raw = activity.toolCall.function.arguments;
    if (raw && raw.trim()) return raw;
  }
  return prettyValue(input);
}

/** The deprecated `_response` arg key, if non-null (else `undefined`). */
function resolveLegacyResponse(activity: ToolActivity): unknown {
  const input = activity.input;
  const value = isObject(input) ? input["_response"] : undefined;
  return value != null ? value : undefined;
}

// ── Parts ──

interface PartProps<State> {
  render?: RenderProp<State, Record<string, unknown>>;
  className?: string;
  children?: ReactNode;
}

function Root({
  activity,
  isLast = false,
  running = true,
  defaultOpen = false,
  open,
  onOpenChange,
  className,
  children,
}: {
  activity: ToolActivity;
  isLast?: boolean;
  /** Whether the owning thread is still running (gates the in-progress animations). */
  running?: boolean;
  /** Initial expand state when uncontrolled. */
  defaultOpen?: boolean;
  /** Controlled expand state, e.g. so a list can keep one call open at a time. */
  open?: boolean;
  /** Called with the requested expand state; pair with `open`. */
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const setOpen = (value: boolean) => {
    if (open === undefined) setUncontrolledOpen(value);
    onOpenChange?.(value);
  };
  const panelId = useId();
  const triggerId = useId();
  return (
    <ToolCallContext.Provider
      value={{ activity, isLast, running, isOpen, setOpen, panelId, triggerId }}
    >
      <div
        className={clsx("openui-tool-call", `openui-tool-call--${activity.status}`, className)}
        data-status={activity.status}
      >
        {children}
      </div>
    </ToolCallContext.Provider>
  );
}

const StatusIcon = ({
  render,
  className,
  size = 14,
}: PartProps<{ status: ToolCallStatus }> & { size?: number }) => {
  const { activity, isLast, running } = useToolCall();
  const spin = isRunning(activity.status) && isLast && running;
  const Icon = toolIcon(activity.toolName, activity.status);
  return renderPart(
    render,
    "span",
    { status: activity.status },
    {
      className: clsx("openui-tool-call__icon-wrapper", className),
      "data-status": activity.status,
      "data-spin": spin,
      children: <Icon size={size} animate={spin} className="openui-tool-call__icon" />,
    },
  );
};

const ToolName = ({ render, className }: PartProps<{ toolName: string }>) => {
  const { activity } = useToolCall();
  return renderPart(
    render,
    "span",
    { toolName: activity.toolName },
    {
      className,
      children: activity.toolName,
    },
  );
};

const StatusText = ({
  render,
  className,
}: PartProps<{ status: ToolCallStatus; label: string }>) => {
  const { activity, isLast, running } = useToolCall();
  const labels = useToolLabels();
  const label = activity.statusMessage ?? defaultLabel(activity.status, activity.toolName, labels);
  const shimmer = isRunning(activity.status) && isLast && running;
  return renderPart(
    render,
    "span",
    { status: activity.status, label },
    {
      // Live region so status transitions (Calling → Running → Called/failed)
      // are announced; only changes are spoken, so settled cards stay quiet.
      role: "status",
      "aria-live": "polite",
      className: clsx(
        "openui-tool-call__name",
        { "openui-tool-call__name--shimmer": shimmer },
        className,
      ),
      children: label,
    },
  );
};

const Parameters = ({ render, className }: PartProps<{ input: unknown; inputString: string }>) => {
  const { activity } = useToolCall();
  // Honors the legacy `_request` key + falls back to raw args when unparseable.
  const inputString = resolveRequest(activity);
  return renderPart(
    render,
    "pre",
    { input: activity.input, inputString },
    {
      className,
      children: inputString,
    },
  );
};

const Result = ({
  render,
  className,
}: PartProps<{ result?: string; isError: boolean; errorText?: string }>) => {
  const { activity } = useToolCall();
  // Legacy tools packed the result into a `_response` arg key (no tool message).
  const legacyResponse = resolveLegacyResponse(activity);
  // Enabled when there's a paired result, an error, or a legacy `_response`.
  if (activity.result == null && !activity.isError && legacyResponse === undefined) return null;
  const text = activity.isError
    ? (activity.errorText ?? activity.result ?? "")
    : legacyResponse !== undefined
      ? prettyValue(legacyResponse)
      : prettyResult(activity.result);
  return renderPart(
    render,
    "div",
    { result: activity.result, isError: activity.isError, errorText: activity.errorText },
    {
      className: clsx({ "openui-tool-call__result--error": activity.isError }, className),
      children: text,
    },
  );
};

const Trigger = ({ render, className, children }: PartProps<{ state: "open" | "closed" }>) => {
  const { isOpen, setOpen, panelId, triggerId } = useToolCall();
  return renderPart(
    render,
    "button",
    { state: isOpen ? "open" : "closed" },
    {
      type: "button",
      id: triggerId,
      className,
      "aria-expanded": isOpen,
      "aria-controls": panelId,
      onClick: () => setOpen(!isOpen),
      children,
    },
  );
};

const Content = ({ render, className, children }: PartProps<{ isOpen: boolean }>) => {
  const { isOpen, panelId, triggerId } = useToolCall();
  if (!isOpen) return null;
  return renderPart(
    render,
    "div",
    { isOpen },
    {
      id: panelId,
      role: "region",
      "aria-labelledby": triggerId,
      "data-state": "open",
      className,
      children,
    },
  );
};

/**
 * The compound tool-call primitive set. Compose `Root` + parts to render a tool
 * call however a given surface needs.
 *
 * @category Components
 */
export const ToolCall = {
  Root,
  Trigger,
  Content,
  StatusIcon,
  StatusText,
  ToolName,
  Parameters,
  Result,
};
