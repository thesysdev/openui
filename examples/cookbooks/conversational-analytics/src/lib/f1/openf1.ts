import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

// OpenF1 client: one throttled request queue per process and a disk cache under data/openf1.
// Finished sessions never change, so their responses are cached forever; calendar lists get a
// short TTL. When OpenF1 is unreachable or rate limited, a stale cached copy is served instead,
// which is what lets `npm run snapshot:f1` make the tools work offline.

export const OPENF1_BASE = "https://api.openf1.org/v1";
const CACHE_DIR = resolve(process.cwd(), "data/openf1");

// The free tier allows 3 requests per second and 30 per minute. A sliding window keeps us under
// both while still letting a single question's few requests go out in a burst.
const PER_SECOND = 3;
const PER_MINUTE = Number(process.env.OPENF1_PER_MINUTE ?? 28);
const sent: number[] = [];
let nextSlot = 0; // set after a 429 to pause the whole queue
let queue = Promise.resolve();
function takeSlot() {
  const turn = queue.then(async () => {
    for (;;) {
      const now = Date.now();
      while (sent.length && now - sent[0] > 60000) sent.shift();
      const lastSecond = sent.filter((t) => now - t < 1000).length;
      let wait = Math.max(0, nextSlot - now);
      if (sent.length >= PER_MINUTE) wait = Math.max(wait, sent[0] + 60000 - now + 50);
      if (lastSecond >= PER_SECOND) wait = Math.max(wait, sent[sent.length - PER_SECOND] + 1000 - now + 50);
      if (!wait) break;
      await new Promise((r) => setTimeout(r, wait));
    }
    sent.push(Date.now());
  });
  queue = turn.catch(() => {});
  return turn;
}

export type Params = Record<string, string | number | undefined>;

export function openf1Url(endpoint: string, params: Params = {}) {
  // OpenF1 filters look like `date>=...`, so the operator is part of the key.
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => {
      const m = /^(.*?)(>=|<=|>|<)$/.exec(k);
      return m
        ? `${encodeURIComponent(m[1])}${m[2]}${encodeURIComponent(String(v))}`
        : `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`;
    })
    .join("&");
  return `${OPENF1_BASE}/${endpoint}${query ? `?${query}` : ""}`;
}

function cachePath(url: string) {
  const endpoint = new URL(url).pathname.split("/").pop() ?? "misc";
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 16);
  return resolve(CACHE_DIR, endpoint, `${hash}.json`);
}

type CacheEntry = { url: string; fetchedAt: number; final: boolean; data: unknown[] };

async function readCache(path: string): Promise<CacheEntry | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as CacheEntry;
  } catch {
    return null;
  }
}

const inflight = new Map<string, Promise<unknown[]>>();
const memory = new Map<string, CacheEntry>();

export interface FetchOptions {
  /** The data can no longer change (a finished session). Cached forever. */
  final?: boolean;
  /** Seconds a non-final cached copy stays fresh (default 10 minutes). */
  ttl?: number;
  signal?: AbortSignal;
  /** Serve only from cache; never hit the network. */
  offline?: boolean;
}

export class OpenF1Error extends Error {}

/** GET an OpenF1 endpoint. A 404 "No results found" is an empty list, not an error. */
export async function openf1<T = Record<string, unknown>>(
  endpoint: string,
  params: Params = {},
  options: FetchOptions = {},
): Promise<T[]> {
  const url = openf1Url(endpoint, params);
  const path = cachePath(url);
  const ttlMs = (options.ttl ?? 600) * 1000;
  const cached = memory.get(url) ?? (await readCache(path));
  if (cached) memory.set(url, cached);
  const fresh =
    cached && (cached.final || options.offline || Date.now() - cached.fetchedAt < ttlMs);
  if (fresh && cached) return cached.data as T[];
  if (options.offline) throw new OpenF1Error(`Not in the local snapshot: ${url}`);

  const pending = inflight.get(url);
  if (pending) return pending as Promise<T[]>;
  const request = (async () => {
    try {
      const data = await fetchWithRetry(url, options.signal);
      const entry: CacheEntry = { url, fetchedAt: Date.now(), final: !!options.final, data };
      memory.set(url, entry);
      // Hosts with a read-only filesystem (e.g. Vercel) keep the in-memory copy only.
      try {
        await mkdir(dirname(path), { recursive: true });
        const tmp = `${path}.${process.pid}.tmp`;
        await writeFile(tmp, JSON.stringify(entry));
        await rename(tmp, path);
      } catch {}
      return data;
    } catch (error) {
      if (cached) return cached.data; // stale beats nothing
      throw error;
    } finally {
      inflight.delete(url);
    }
  })();
  inflight.set(url, request);
  return request as Promise<T[]>;
}

async function fetchWithRetry(url: string, signal?: AbortSignal): Promise<unknown[]> {
  let backoff = 4000;
  for (let attempt = 0; ; attempt++) {
    await takeSlot();
    signal?.throwIfAborted();
    let response: Response;
    try {
      response = await fetch(url, {
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(45000)]) : AbortSignal.timeout(45000),
        headers: { accept: "application/json" },
      });
    } catch (error) {
      if (attempt >= 2 || signal?.aborted) throw new OpenF1Error(`OpenF1 unreachable: ${String(error)}`);
      await new Promise((r) => setTimeout(r, backoff));
      backoff *= 2;
      continue;
    }
    if (response.status === 404) return [];
    if (response.status === 429 || response.status >= 500) {
      if (attempt >= 4) throw new OpenF1Error(`OpenF1 HTTP ${response.status}. Try again shortly.`);
      const retryAfter = Number(response.headers.get("retry-after"));
      // Push the whole queue back, so other requests wait too.
      const pause = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoff;
      nextSlot = Math.max(nextSlot, Date.now() + pause);
      backoff *= 2;
      continue;
    }
    if (!response.ok) throw new OpenF1Error(`OpenF1 HTTP ${response.status} for ${url}`);
    const body = (await response.json()) as unknown;
    if (!Array.isArray(body)) return [];
    return body;
  }
}
