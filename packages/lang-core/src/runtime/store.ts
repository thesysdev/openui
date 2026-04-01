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
    // Remove stale $binding keys not present in new declarations
    for (const key of [...state.keys()]) {
      if (key.startsWith("$") && !(key in defaults) && !(key in persisted)) {
        state.delete(key);
      }
    }
    // Set all binding defaults and persisted values
    const allKeys = new Set([...Object.keys(defaults), ...Object.keys(persisted)]);
    for (const key of allKeys) {
      state.set(key, key in persisted ? persisted[key] : defaults[key]);
    }
    rebuildSnapshot();
    notify();
  }

  function dispose(): void {
    state.clear();
    listeners.clear();
    snapshot = {};
  }

  return { get, set, subscribe, getSnapshot, initialize, dispose };
}
