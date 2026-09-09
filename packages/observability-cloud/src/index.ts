import { CloudObservabilityClient } from "./core/client";
import type { WireEvent } from "./core/wire";

export type { StreamWireEvent, WireEnvelope, WireErrorEntry, WireEvent } from "./core/wire";

const DEFAULT_ENDPOINT = "https://ingest.thesys.dev/v1/events";
/** Also read by `@openuidev/devtools` to tell Cloud apps from OSS ones. */
const GLOBAL_KEY = Symbol.for("openui.cloudObservability");

export interface CloudObservabilityOptions {
  /** Your publishable API key from the Thesys console (`pk-th-…`). */
  apiKey: string;
  endpoint?: string;
  capture?: "full" | "minimal";
  sampleRate?: number;
  beforeSend?: (event: WireEvent) => WireEvent | null;
  debug?: boolean;
}

interface CloudObservabilityGlobal {
  client: CloudObservabilityClient | null;
  options: CloudObservabilityOptions | null;
}

function getGlobalState(): CloudObservabilityGlobal {
  const root = globalThis as Record<symbol, CloudObservabilityGlobal | undefined>;
  if (!root[GLOBAL_KEY]) {
    root[GLOBAL_KEY] = { client: null, options: null };
  }
  return root[GLOBAL_KEY]!;
}

function debugLog(options: CloudObservabilityOptions | null | undefined, message: string): void {
  if (!options?.debug) return;
  // eslint-disable-next-line no-console -- gated debug diagnostics for cloud sink
  console.debug("[@openuidev/observability-cloud]", message);
}

function debugWarn(options: CloudObservabilityOptions, message: string): void {
  if (!options.debug) return;
  console.warn("[@openuidev/observability-cloud]", message);
}

function resolvedEndpoint(options: CloudObservabilityOptions): string {
  return options.endpoint ?? DEFAULT_ENDPOINT;
}

function resolvedCapture(options: CloudObservabilityOptions): "full" | "minimal" {
  return options.capture ?? "full";
}

function resolvedSampleRate(options: CloudObservabilityOptions): number {
  const raw = options.sampleRate ?? 1;
  const clamped = Math.min(1, Math.max(0, raw));
  if (clamped !== raw) {
    debugWarn(options, `sampleRate ${raw} is outside [0, 1] and was clamped to ${clamped}`);
  }
  return clamped;
}

function resolvedDebug(options: CloudObservabilityOptions): boolean {
  return options.debug ?? false;
}

function optionsEqual(a: CloudObservabilityOptions, b: CloudObservabilityOptions): boolean {
  return (
    a.apiKey === b.apiKey &&
    resolvedEndpoint(a) === resolvedEndpoint(b) &&
    resolvedCapture(a) === resolvedCapture(b) &&
    resolvedSampleRate(a) === resolvedSampleRate(b) &&
    resolvedDebug(a) === resolvedDebug(b) &&
    a.beforeSend === b.beforeSend
  );
}

function createClient(options: CloudObservabilityOptions): CloudObservabilityClient {
  return new CloudObservabilityClient({
    apiKey: options.apiKey,
    endpoint: resolvedEndpoint(options),
    capture: resolvedCapture(options),
    sampleRate: resolvedSampleRate(options),
    beforeSend: options.beforeSend,
    debug: resolvedDebug(options),
  });
}

export function init(options: CloudObservabilityOptions): void {
  try {
    if (typeof window === "undefined") {
      debugLog(options, "init skipped in non-browser environment");
      return;
    }

    const state = getGlobalState();
    if (state.client && state.options && optionsEqual(state.options, options)) {
      debugLog(options, "init skipped; already initialized with equivalent options");
      return;
    }

    const priorClient = state.client;
    const priorOptions = state.options;

    try {
      const client = createClient(options);
      if (priorClient) {
        void priorClient.close().catch(() => {});
      }
      state.client = client;
      state.options = options;
    } catch (error) {
      state.client = priorClient;
      state.options = priorOptions;
      if (options.debug) {
        console.warn("[@openuidev/observability-cloud]", "init failed", error);
      }
    }
  } catch (error) {
    if (options.debug) {
      console.warn("[@openuidev/observability-cloud]", "init failed", error);
    }
  }
}

export async function flush(timeoutMs?: number): Promise<boolean> {
  try {
    const client = getGlobalState().client;
    if (!client) return true;
    return await client.flush(timeoutMs);
  } catch (error) {
    const options = getGlobalState().options;
    if (options?.debug) {
      console.warn("[@openuidev/observability-cloud]", "flush failed", error);
    }
    return false;
  }
}

export async function close(): Promise<void> {
  try {
    const state = getGlobalState();
    if (!state.client) return;
    await state.client.close();
    state.client = null;
    state.options = null;
  } catch (error) {
    const options = getGlobalState().options;
    if (options?.debug) {
      console.warn("[@openuidev/observability-cloud]", "close failed", error);
    }
    getGlobalState().client = null;
    getGlobalState().options = null;
  }
}
