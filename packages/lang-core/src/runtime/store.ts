// ─────────────────────────────────────────────────────────────────────────────
// Reactive state store for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

export interface Store {
  get(name: string): unknown;
  set(name: string, value: unknown): void;
  subscribe(listener: () => void): () => void;
  getSnapshot(): Record<string, unknown>;
  initialize(defaults: Record<string, unknown>, persisted: Record<string, unknown>): void;
  dispose(): void;
}

export function createStore(): Store {
  const state = new Map<string, unknown>();
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

  function set(name: string, value: unknown): void {
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
    pristine.delete(name);
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
    let changed = false;

    // Apply persisted values (explicit restore). These take precedence and are not pristine.
    for (const key of Object.keys(persisted)) {
      pristine.delete(key);
      const val = persisted[key];
      if (!state.has(key) || !Object.is(state.get(key), val)) {
        state.set(key, val);
        changed = true;
      }
    }

    // Apply defaults:
    // 1. For newly encountered keys, seed default and mark as pristine.
    // 2. For existing keys that are STILL pristine (never modified by user or persisted),
    //    allow updated declaration defaults to take effect (e.g. streaming string recovery).
    // Existing user-modified values (not in pristine) are always preserved.
    for (const key of Object.keys(defaults)) {
      const val = defaults[key];
      if (!state.has(key)) {
        state.set(key, val);
        pristine.add(key);
        changed = true;
      } else if (pristine.has(key)) {
        if (!Object.is(state.get(key), val)) {
          state.set(key, val);
          changed = true;
        }
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
