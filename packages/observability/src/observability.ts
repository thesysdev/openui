import type {
  Handler,
  Observability,
  ObservabilityDetail,
  ObservabilityEvent,
  ObservabilityLevel,
  Remove,
} from "./types";

/** Private — not part of the public API. */
const EVENT_TYPE = "openui:observability";

function unwrap(raw: Event): ObservabilityEvent | undefined {
  if (!("detail" in raw)) return undefined;
  const event = (raw as CustomEvent<ObservabilityEvent>).detail;
  if (event == null || typeof event !== "object") return undefined;
  return event;
}

type Registration = {
  listener: (raw: Event) => void;
  levels: Set<ObservabilityLevel>;
  all: boolean;
};

/** Internal — the package exports a single shared instance, not this factory. */
function createObservability(): Observability {
  const registrations = new Map<Handler, Registration>();

  // A throwing listener must not break the emitter or other listeners.
  const deliver = (listener: Handler, event: ObservabilityEvent) => {
    try {
      listener(event);
    } catch (error) {
      console.error("[@openuidev/observability] listener threw", error);
    }
  };

  const subscribe = (handler: Handler, keys: "all" | ObservabilityLevel[]): Remove => {
    // Delivery is browser-only; no-op on the server.
    if (typeof window === "undefined") return () => {};

    let registration = registrations.get(handler);
    if (!registration) {
      const listener = (raw: Event) => {
        const current = registrations.get(handler);
        if (!current) return;
        const event = unwrap(raw);
        if (!event) return;
        if (!current.all && !current.levels.has(event.level)) return;
        deliver(handler, event);
      };
      window.addEventListener(EVENT_TYPE, listener);
      registration = { listener, levels: new Set(), all: false };
      registrations.set(handler, registration);
    }
    if (keys === "all") {
      registration.all = true;
    } else {
      for (const level of keys) registration.levels.add(level);
    }

    return () => {
      const current = registrations.get(handler);
      if (!current) return;
      if (keys === "all") {
        current.all = false;
      } else {
        for (const level of keys) current.levels.delete(level);
      }
      if (!current.all && current.levels.size === 0) {
        window.removeEventListener(EVENT_TYPE, current.listener);
        registrations.delete(handler);
      }
    };
  };

  const emit = (level: ObservabilityLevel, detail: ObservabilityDetail): void => {
    if (typeof window === "undefined") return;
    const event: ObservabilityEvent = { level, timestamp: Date.now(), detail };
    window.dispatchEvent(new CustomEvent(EVENT_TYPE, { detail: event }));
  };

  // The bus IS the emit function, with the rest of the API attached to it.
  const bus = emit as Observability;

  bus.listen = (level, handler) => {
    const levels = Array.isArray(level) ? level : [level];
    return subscribe(handler as Handler, levels);
  };
  bus.listenAll = (handler) => subscribe(handler, "all");
  bus.info = (detail) => emit("info", detail);
  bus.warn = (detail) => emit("warning", detail);
  bus.error = (detail) => emit("error", detail);

  return bus;
}

/**
 * The shared observability bus. Keyed on globalThis via `Symbol.for` so
 * duplicate copies of this module (ESM/CJS dual builds, nested package
 * versions) still share one instance.
 */
const BUS_KEY = Symbol.for("openui.observability");
const store = globalThis as { [BUS_KEY]?: Observability };
export const observability: Observability = (store[BUS_KEY] ??= createObservability());
