// Saved UI preferences (sidebar state, theme mode): the one place that touches
// localStorage. Values are JSON. Never throws: on the server, or with storage
// blocked or full, reads return undefined and writes are dropped, so a
// preference just isn't kept.

export function readPreference<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

/** Saves `value`; `undefined` clears the key. */
export function writePreference(key: string, value: unknown): void {
  try {
    if (value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Blocked or over quota.
  }
}
