import type { ObservabilityEvent } from "@openuidev/observability";

const STREAM_KIND = "react-lang:stream";

export type InspectListItem =
  | { type: "event"; event: ObservabilityEvent }
  | { type: "run"; runId: string; events: ObservabilityEvent[] };

export function eventRunId(event: ObservabilityEvent): string | null {
  const runId = event.detail["runId"];
  return typeof runId === "string" && runId.length > 0 ? runId : null;
}

export function eventKind(event: ObservabilityEvent): string | undefined {
  return typeof event.detail["kind"] === "string" ? event.detail["kind"] : undefined;
}

/**
 * Collapse events that share a `runId` into one list item, parked at the
 * newest event of that run. A standalone Renderer stream can form a group
 * on its own; a lone in-flight request stays an ordinary row.
 */
export function groupEventsByRunId(events: ObservabilityEvent[]): InspectListItem[] {
  const buckets = new Map<string, ObservabilityEvent[]>();
  for (const event of events) {
    const runId = eventRunId(event);
    if (!runId) continue;
    const bucket = buckets.get(runId);
    if (bucket) bucket.push(event);
    else buckets.set(runId, [event]);
  }

  const emitted = new Set<string>();
  const items: InspectListItem[] = [];
  for (const event of events) {
    const runId = eventRunId(event);
    if (!runId) {
      items.push({ type: "event", event });
      continue;
    }
    const bucket = buckets.get(runId)!;
    if (bucket.length === 1 && eventKind(event) !== STREAM_KIND) {
      items.push({ type: "event", event });
      continue;
    }
    if (emitted.has(runId)) continue;
    emitted.add(runId);
    items.push({ type: "run", runId, events: presentRunEvents(bucket) });
  }
  return items;
}

/** Request, response/error, then each Renderer stream inside the card. */
export function presentRunEvents(events: ObservabilityEvent[]): ObservabilityEvent[] {
  return sortRunEvents(collapseStreams(events));
}

export function runGroupTitle(events: ObservabilityEvent[]): string {
  for (const event of events) {
    const title = event.detail["runTitle"];
    if (typeof title === "string" && title.trim()) return title.trim();
  }
  for (const event of events) {
    if (eventKind(event) !== "LLM:request") continue;
    const text = userMessageText(event.detail["userMessage"]);
    if (text) return text;
  }
  return "LLM run";
}

/** Worst level in the group, including stream parse errors and 429s. */
export function runGroupLevel(events: ObservabilityEvent[]): ObservabilityEvent["level"] {
  if (events.some((event) => event.level === "error")) return "error";
  if (events.some((event) => event.level === "warning")) return "warning";
  return "info";
}

export function displayEventKind(kind: string): string {
  switch (kind) {
    case "LLM:request":
      return "Request sent";
    case "LLM:response":
      return "Response received";
    case "LLM:error":
      return "Request failed";
    default:
      return kind;
  }
}

function collapseStreams(events: ObservabilityEvent[]): ObservabilityEvent[] {
  const streams = new Map<string, ObservabilityEvent>();
  const remaining: ObservabilityEvent[] = [];
  for (const event of events) {
    const id = event.detail["id"];
    if (eventKind(event) !== STREAM_KIND || typeof id !== "string") {
      remaining.push(event);
      continue;
    }
    const previous = streams.get(id);
    if (!previous || preferStream(event, previous)) streams.set(id, event);
  }
  return [...remaining, ...streams.values()];
}

function preferStream(candidate: ObservabilityEvent, best: ObservabilityEvent): boolean {
  const candidateSettled = candidate.detail["phase"] === "settled";
  const bestSettled = best.detail["phase"] === "settled";
  if (candidateSettled !== bestSettled) return candidateSettled;
  return candidate.timestamp >= best.timestamp;
}

function sortRunEvents(events: ObservabilityEvent[]): ObservabilityEvent[] {
  return [...events].sort((a, b) => {
    const rank = kindRank(eventKind(a)) - kindRank(eventKind(b));
    if (rank !== 0) return rank;
    return a.timestamp - b.timestamp;
  });
}

function kindRank(kind: string | undefined): number {
  if (kind === "LLM:request") return 0;
  if (kind === "LLM:response" || kind === "LLM:error") return 1;
  if (kind === STREAM_KIND) return 2;
  return 3;
}

function userMessageText(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  const content = (value as { content?: unknown }).content;
  if (typeof content === "string") {
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (!Array.isArray(content)) return undefined;
  const text = content
    .map((part) => {
      if (typeof part === "string") return part;
      if (
        part &&
        typeof part === "object" &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        return (part as { text: string }).text;
      }
      return "";
    })
    .join("");
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
