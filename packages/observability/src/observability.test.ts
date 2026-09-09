// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ObservabilityEvent } from "./index";
import { observability } from "./index";

// The bus is a shared singleton, so each test tracks its subscriptions and
// removes them afterwards to stay isolated from the next test.
const cleanups: Array<() => void> = [];
function track(off: () => void): void {
  cleanups.push(off);
}
afterEach(() => {
  while (cleanups.length) cleanups.pop()?.();
});

describe("observability bus", () => {
  it("delivers to a level listener and not to other levels", () => {
    const errors: ObservabilityEvent[] = [];
    const infos: ObservabilityEvent[] = [];
    track(observability.listen("error", (event) => errors.push(event)));
    track(observability.listen("info", (event) => infos.push(event)));

    observability("error", { kind: "boom" });

    expect(errors).toHaveLength(1);
    expect(errors[0]?.level).toBe("error");
    expect(errors[0]?.detail.kind).toBe("boom");
    expect(infos).toHaveLength(0);
  });

  it("level shortcuts emit at the matching level", () => {
    const levels: string[] = [];
    track(observability.listenAll((event) => levels.push(event.level)));

    observability.info({ kind: "i" });
    observability.warn({ kind: "w" });
    observability.error({ kind: "e" });

    expect(levels).toEqual(["info", "warning", "error"]);
  });

  it("the callable form emits at the given level", () => {
    const levels: string[] = [];
    track(observability.listenAll((event) => levels.push(event.level)));

    observability("warning", { kind: "x" });

    expect(levels).toEqual(["warning"]);
  });

  it("an array key matches any of the listed levels", () => {
    const levels: string[] = [];
    track(observability.listen(["warning", "error"], (event) => levels.push(event.level)));

    observability.info({ kind: "i" });
    observability.warn({ kind: "w" });
    observability.error({ kind: "e" });

    expect(levels).toEqual(["warning", "error"]);
  });

  it("listenAll receives every event", () => {
    const kinds: unknown[] = [];
    track(observability.listenAll((event) => kinds.push(event.detail.kind)));

    observability.info({ kind: "a" });
    observability.error({ kind: "b" });

    expect(kinds).toEqual(["a", "b"]);
  });

  it("a handler matched by both a level and listenAll fires once per event", () => {
    const handler = vi.fn();
    track(observability.listen("error", handler));
    track(observability.listenAll(handler));

    observability.error({ kind: "once" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("unsubscribing stops delivery", () => {
    const handler = vi.fn();
    const off = observability.listen("error", handler);
    off();

    observability.error({ kind: "gone" });

    expect(handler).not.toHaveBeenCalled();
  });

  it("stamps the event with level, a numeric timestamp, and the detail", () => {
    let received: ObservabilityEvent | undefined;
    track(observability.listen("info", (event) => (received = event)));

    observability.info({ kind: "shape", extra: 1 });

    expect(received?.level).toBe("info");
    expect(typeof received?.timestamp).toBe("number");
    expect(received?.detail).toMatchObject({ kind: "shape", extra: 1 });
  });

  it("preserves an optional stable event id in the detail", () => {
    let received: ObservabilityEvent | undefined;
    track(observability.listenAll((event) => (received = event)));

    observability.info({ id: "event-1", kind: "stream:update" });

    expect(received?.detail.id).toBe("event-1");
  });

  it("shares one bus across duplicate copies via Symbol.for", () => {
    const key = Symbol.for("openui.observability");
    const store = globalThis as { [key]?: typeof observability };
    expect(store[key]).toBe(observability);
  });

  it("a throwing listener does not break the others", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const good = vi.fn();
    track(
      observability.listen("error", () => {
        throw new Error("bad listener");
      }),
    );
    track(observability.listen("error", good));

    expect(() => observability.error({ kind: "resilient" })).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });
});
