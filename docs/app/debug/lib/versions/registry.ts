import { gte, rcompare, valid } from "semver";
import { BUNDLED_LANG_CORE_VERSION } from "./loader";
import type { VersionList } from "./types";

const REGISTRY_URL = "https://registry.npmjs.org/@openuidev/lang-core";
const CACHE_KEY = "paste:lang-core-versions:v1";
const CACHE_TTL_MS = 10 * 60 * 1000;

interface CachedList {
  fetchedAt: number;
  versions: string[];
  latest: string | null;
}

function readCache(): CachedList | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedList;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(entry: CachedList): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // storage full / private mode — cache is best-effort
  }
}

function group(versions: string[], latest: string | null): VersionList {
  const sorted = [...versions].filter((v) => valid(v)).sort(rcompare);
  const groups = new Map<string, string[]>();
  for (const v of sorted) {
    const [major, minor] = v.split(".");
    const label = `${major}.${minor}`;
    const list = groups.get(label) ?? [];
    list.push(v);
    groups.set(label, list);
  }
  return {
    groups: [...groups.entries()].map(([label, vs]) => ({ label, versions: vs })),
    latest,
  };
}

/** Always expose the workspace package, and prefer it as latest when it is newer than npm. */
function resolveList(versions: string[], npmLatest: string | null): VersionList {
  const bundled = BUNDLED_LANG_CORE_VERSION;
  const all = versions.includes(bundled) ? versions : [...versions, bundled];
  const latest = npmLatest && valid(npmLatest) && !gte(bundled, npmLatest) ? npmLatest : bundled;
  return group(all, latest);
}

/** Fallback entry so the picker always works even when the registry is down. */
export function bundledOnlyList(): VersionList {
  return resolveList([], null);
}

export async function fetchVersionList(): Promise<VersionList> {
  const cached = readCache();
  if (cached) return resolveList(cached.versions, cached.latest);

  const res = await fetch(REGISTRY_URL, {
    // Corgi doc: much smaller than the full packument, still has versions + dist-tags.
    headers: { Accept: "application/vnd.npm.install-v1+json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`npm registry responded ${res.status}`);
  const doc = (await res.json()) as {
    versions?: Record<string, unknown>;
    "dist-tags"?: Record<string, string>;
  };
  const versions = Object.keys(doc.versions ?? {});
  const latest = doc["dist-tags"]?.latest ?? null;
  if (versions.length === 0) throw new Error("npm registry returned no versions");
  writeCache({ fetchedAt: Date.now(), versions, latest });
  return resolveList(versions, latest);
}
