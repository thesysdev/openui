import type { ArtifactStorage, ArtifactSummary } from "@openuidev/react-headless";

/**
 * Artifacts the lists have loaded, shared by every list and renderer on the
 * same storage, so a pin or delete shows everywhere at once.
 */
export class ArtifactCache {
  private readonly summaries = new Map<string, ArtifactSummary>();
  private readonly deleted = new Set<string>();
  /** Artifacts the user lost access to, by when: the `listStarted()` count. */
  private readonly evicted = new Map<string, number>();
  private readonly listeners = new Set<() => void>();
  private version = 0;
  private lists = 0;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Changes whenever any artifact changes, for `useSyncExternalStore`. */
  getVersion = (): number => this.version;

  get(id: string): ArtifactSummary | undefined {
    return this.summaries.get(id);
  }

  /** Every artifact loaded so far. */
  all(): ArtifactSummary[] {
    return [...this.summaries.values()];
  }

  isDeleted(id: string): boolean {
    return this.deleted.has(id);
  }

  /** Call as a list request starts, and pass the result to `put` with its page. */
  listStarted(): number {
    return ++this.lists;
  }

  /**
   * Adds or replaces artifacts. An evicted one comes back from an action's
   * result, or from a list that started after it was evicted.
   */
  put(summaries: ArtifactSummary[], listedAt?: number): void {
    for (const summary of summaries) {
      if (this.deleted.has(summary.id)) continue;
      const evictedAt = this.evicted.get(summary.id);
      if (evictedAt !== undefined) {
        if (listedAt !== undefined && listedAt <= evictedAt) continue;
        this.evicted.delete(summary.id);
      }
      this.summaries.set(summary.id, summary);
    }
    this.notify();
  }

  patch(id: string, patch: Partial<ArtifactSummary>): void {
    const current = this.summaries.get(id);
    if (current) this.summaries.set(id, { ...current, ...patch });
    this.notify();
  }

  /**
   * Drops an artifact the user can no longer see (deleted elsewhere, or
   * unshared). Unlike `remove`, it comes back if it's shared again.
   */
  evict(id: string): void {
    if (!this.summaries.has(id) && this.evicted.has(id)) return;
    this.evicted.set(id, this.lists);
    this.summaries.delete(id);
    this.notify();
  }

  remove(id: string): void {
    this.deleted.add(id);
    this.summaries.delete(id);
    this.notify();
  }

  restore(summary: ArtifactSummary): void {
    this.deleted.delete(summary.id);
    this.summaries.set(summary.id, summary);
    this.notify();
  }

  private notify(): void {
    this.version += 1;
    this.listeners.forEach((listener) => listener());
  }
}

const caches = new WeakMap<ArtifactStorage, ArtifactCache>();

export function cacheFor(storage: ArtifactStorage): ArtifactCache {
  let cache = caches.get(storage);
  if (!cache) {
    cache = new ArtifactCache();
    caches.set(storage, cache);
  }
  return cache;
}
