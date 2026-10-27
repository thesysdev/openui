import type { ObservabilityEvent } from "@openuidev/observability";
import { selectArtifactEvent } from "../events/artifact";
import { selectStreamEvent } from "../events/stream";
import type { WireEvent } from "./wire";

export interface SelectorOptions {
  capture: "full" | "minimal";
  sampleRate: number;
  beforeSend?: (event: WireEvent) => WireEvent | null;
  debug: boolean;
}

/** Kind-specific selectors. Add a new event by appending its select* function. */
const eventSelectors = [selectStreamEvent, selectArtifactEvent] as const;

function hashToUnitInterval(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function debugWarn(debug: boolean, message: string, error?: unknown): void {
  if (!debug) return;
  if (error === undefined) {
    console.warn("[@openuidev/observability-cloud]", message);
    return;
  }
  console.warn("[@openuidev/observability-cloud]", message, error);
}

function shapeEvent(
  event: ObservabilityEvent,
  capture: SelectorOptions["capture"],
): WireEvent | null {
  for (const select of eventSelectors) {
    const shaped = select(event, capture);
    if (shaped) return shaped;
  }
  return null;
}

/** Shared pipeline: kind-specific selection, then sampling and beforeSend. */
export function selectEvent(event: ObservabilityEvent, options: SelectorOptions): WireEvent | null {
  const shaped = shapeEvent(event, options.capture);
  if (!shaped) return null;

  if (options.sampleRate < 1 && hashToUnitInterval(shaped.id) >= options.sampleRate) {
    return null;
  }

  if (!options.beforeSend) return shaped;

  try {
    return options.beforeSend(shaped);
  } catch (error) {
    debugWarn(options.debug, "beforeSend threw; dropping event", error);
    return null;
  }
}
