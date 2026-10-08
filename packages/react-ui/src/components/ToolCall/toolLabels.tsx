import type { ToolCallStatus } from "@openuidev/react-headless";
import { createContext, useContext, type ReactNode } from "react";

/**
 * What a tool call reads as in the UI, per stage: `running` while it streams or
 * executes ("Searching the web"), `done` once it has a result ("Searched the
 * web"), and `failed` when it errors ("Web search failed").
 *
 * @category Types
 */
export interface ToolLabel {
  running: string;
  done: string;
  failed: string;
}

/** Tool name → its label. Keys are matched exactly, case-insensitively. @category Types */
export type ToolLabels = Record<string, Partial<ToolLabel>>;

// Built-in tool families, matched on the tool name.
const BUILT_IN_LABELS: { match: RegExp; label: ToolLabel }[] = [
  {
    match: /image[_-]?search/i,
    label: { running: "Finding images", done: "Found images", failed: "Image search failed" },
  },
  {
    match: /web[_-]?search/i,
    label: { running: "Searching the web", done: "Searched the web", failed: "Web search failed" },
  },
  {
    match: /weather/i,
    label: {
      running: "Checking the weather",
      done: "Checked the weather",
      failed: "Weather check failed",
    },
  },
  {
    match: /artifact|generate[_-]?report/i,
    label: {
      running: "Building the artifact",
      done: "Built the artifact",
      failed: "Couldn't build the artifact",
    },
  },
  {
    match: /^mcp[_-]?list[_-]?tools$/i,
    label: {
      running: "Connecting to tools",
      done: "Connected to tools",
      failed: "Couldn't connect to tools",
    },
  },
];

// Vendor prefixes that say who provides a tool, not what it does.
const VENDOR_PREFIX = /^(thesys|openui)[_-]/i;

/**
 * Turns a raw tool name into words: `thesys_image_search` → "image search",
 * `getWeather` → "get weather". Exported for apps that label tools themselves.
 *
 * @category Functions
 */
export function humanizeToolName(name: string): string {
  return name
    .trim()
    .replace(VENDOR_PREFIX, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** The full label for a tool, from an override, a built-in family, or its name. */
function resolveLabel(name: string, overrides?: ToolLabels): ToolLabel {
  const words = humanizeToolName(name);
  const fallback: ToolLabel = words
    ? { running: `Using ${words}`, done: `Used ${words}`, failed: `${capitalize(words)} failed` }
    : { running: "Using a tool", done: "Used a tool", failed: "Tool failed" };
  const builtIn = BUILT_IN_LABELS.find((entry) => entry.match.test(name))?.label ?? fallback;
  const key = Object.keys(overrides ?? {}).find((k) => k.toLowerCase() === name.toLowerCase());
  return { ...builtIn, ...(key ? overrides![key] : undefined) };
}

/**
 * The label for a tool call at a given status.
 *
 * @category Functions
 */
export function toolLabel(status: ToolCallStatus, name: string, overrides?: ToolLabels): string {
  const label = resolveLabel(name, overrides);
  if (status === "error") return label.failed;
  if (status === "complete") return label.done;
  return label.running;
}

const ToolLabelsContext = createContext<ToolLabels | undefined>(undefined);

/**
 * Gives your own tools on-brand labels everywhere tool calls render, e.g.
 * `<ToolLabelsProvider labels={{ get_forecast: { running: "Checking the
 * forecast", done: "Checked the forecast" } }}>`. Any stage left out falls back
 * to the built-in copy.
 *
 * @category Components
 */
export function ToolLabelsProvider({
  labels,
  children,
}: {
  labels: ToolLabels;
  children: ReactNode;
}) {
  return <ToolLabelsContext.Provider value={labels}>{children}</ToolLabelsContext.Provider>;
}

/** Label overrides from the nearest {@link ToolLabelsProvider}, if any. @category Hooks */
export function useToolLabels(): ToolLabels | undefined {
  return useContext(ToolLabelsContext);
}
