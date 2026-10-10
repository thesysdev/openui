// ─────────────────────────────────────────────────────────────────────────────
// Reactive state store for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

export interface Store {
  get(name: string): unknown;
  /** `pristine: true` restores a declared default that a later parse may still replace. */
  set(name: string, value: unknown, options?: { pristine?: boolean }): void;
  subscribe(listener: () => void): () => void;
  getSnapshot(): Record<string, unknown>;
  initialize(defaults: Record<string, unknown>, persisted: Record<string, unknown>): void;
  dispose(): void;
}

export function createStore(): Store {
  const state = new Map<string, unknown>();
  // Keys still holding their declared default; a later parse may replace it.
  const pristine = new Set<string>();
  const listeners = new Set<() => void>();
  let snapshot: Record<string, unknown> = {};

  function notify() {
    const currentListeners = [...listeners];
    for (const listener of currentListeners) {
      listener();
    }
  }

  function rebuildSnapshot() {
    snapshot = Object.fromEntries(state);
  }

  function get(name: string): unknown {
    return state.get(name);
  }

  function set(name: string, value: unknown, options?: { pristine?: boolean }): void {
    if (options?.pristine) pristine.add(name);
    else pristine.delete(name);
    const existing = state.get(name);
    if (Object.is(existing, value)) return;
    // Shallow-compare plain objects (form data)
    if (
      value &&
      existing &&
      typeof value === "object" &&
      typeof existing === "object" &&
      !Array.isArray(value) &&
      !Array.isArray(existing)
    ) {
      const nk = Object.keys(value as Record<string, unknown>);
      const ok = Object.keys(existing as Record<string, unknown>);
      if (
        nk.length === ok.length &&
        nk.every((k) =>
          Object.is(
            (value as Record<string, unknown>)[k],
            (existing as Record<string, unknown>)[k],
          ),
        )
      ) {
        return;
      }
    }
    state.set(name, value);
    rebuildSnapshot();
    notify();
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function getSnapshot(): Record<string, unknown> {
    return snapshot;
  }

  function initialize(defaults: Record<string, unknown>, persisted: Record<string, unknown>): void {
    // Defaults replace a pristine value (e.g. one read from a truncated statement
    // while streaming). User-set and persisted values are never overwritten, and
    // keys are never deleted: declarations can briefly disappear while streaming.
    let changed = false;
    for (const key of Object.keys(persisted)) {
      pristine.delete(key);
      if (!state.has(key) || !Object.is(state.get(key), persisted[key])) {
        state.set(key, persisted[key]);
        changed = true;
      }
    }
    for (const key of Object.keys(defaults)) {
      if (!state.has(key)) {
        state.set(key, defaults[key]);
        pristine.add(key);
        changed = true;
      } else if (pristine.has(key) && !Object.is(state.get(key), defaults[key])) {
        state.set(key, defaults[key]);
        changed = true;
      }
    }
    if (changed) {
      rebuildSnapshot();
      notify();
    }
  }

  function dispose(): void {
    state.clear();
    pristine.clear();
    listeners.clear();
    snapshot = {};
  }

  return { get, set, subscribe, getSnapshot, initialize, dispose };
}
