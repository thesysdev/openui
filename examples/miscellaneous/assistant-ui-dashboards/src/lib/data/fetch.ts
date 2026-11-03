import { ToolExecutionError } from "@openuidev/server";

// Helpers for data tools that call public APIs: a timeout, a small cache, and lenient arguments.

const TIMEOUT_MS = 10_000;
const cache = new Map<string, { expires: number; value: Promise<unknown> }>();

/**
 * Runs `load` once per key every `ttlMs`, so a dashboard opened again, or several queries
 * asking for the same thing, don't spend the APIs' rate limits. Failures aren't cached.
 */
export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { expires: Date.now() + ttlMs, value });
  value.catch(() => cache.delete(key));
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return value;
}

/** GETs (or POSTs) JSON, giving up after 10 seconds or when the dashboard's request ends. */
export async function fetchJson<T>(
  url: string,
  init: { signal?: AbortSignal; headers?: Record<string, string>; body?: unknown; source: string },
): Promise<{ status: number; data: T | null }> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(url, {
      method: init.body === undefined ? "GET" : "POST",
      headers: {
        accept: "application/json",
        ...(init.body !== undefined && { "content-type": "application/json" }),
        ...init.headers,
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal,
    });
  } catch (error) {
    const timedOut = timeout.aborted;
    throw new ToolExecutionError(
      timedOut
        ? `${init.source} didn't answer in time`
        : `Couldn't reach ${init.source}: ${error instanceof Error ? error.message : String(error)}`,
      "upstream_unavailable",
      504,
    );
  }
  if (response.status === 404) return { status: 404, data: null };
  if (!response.ok && response.status !== 202) {
    const detail = await response.text().catch(() => "");
    throw new ToolExecutionError(
      `${init.source} answered ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      response.status === 403 || response.status === 429 ? "rate_limited" : "upstream_error",
      response.status === 403 || response.status === 429 ? 429 : 502,
    );
  }
  const text = await response.text();
  return { status: response.status, data: text ? (JSON.parse(text) as T) : null };
}

export function notFound(message: string): never {
  throw new ToolExecutionError(message, "not_found", 404);
}

// Dashboards call tools with whatever their Query() passes, and the interpreter doesn't check
// it against `parameters`: a filter nobody picked yet arrives as "" or null. These read an
// argument leniently and fall back to the default.

export function text(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

export function int(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(text(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  const picked = text(value).toLowerCase();
  return (options as readonly string[]).includes(picked) ? (picked as T) : fallback;
}

/** "react, vue" or ["react", "vue"] → ["react", "vue"], at most `max`, no duplicates. */
export function list(value: unknown, max: number): string[] {
  const items = Array.isArray(value) ? value.map((item) => text(item)) : text(value).split(",");
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))].slice(0, max);
}

/** The last `months` months, as "YYYY-MM", oldest first. */
export function lastMonths(months: number, end = new Date()): string[] {
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (months - 1 - index), 1),
    );
    return date.toISOString().slice(0, 7);
  });
}

/** Counts dates ("2026-05-04…") per month over the last `months` months. */
export function perMonth(dates: string[], months: number) {
  const keys = lastMonths(months);
  const counts = new Map(keys.map((key) => [key, 0]));
  for (const date of dates) {
    const key = date.slice(0, 7);
    if (counts.has(key)) counts.set(key, counts.get(key)! + 1);
  }
  return keys.map((month) => ({ month, count: counts.get(month)! }));
}
