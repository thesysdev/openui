import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryManager, type QueryNode, type ToolProvider } from "../queryManager";

function node(statementId: string, refreshInterval = 0): QueryNode {
  return {
    statementId,
    toolName: "get_data",
    args: {},
    defaults: {},
    deps: null,
    refreshInterval,
    complete: true,
  };
}

/** Flush pending microtasks so in-flight fetches settle, without advancing fake timers. */
async function flushMicrotasks() {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

describe("QueryManager refresh interval lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("fires the refresh timer periodically on a steady mount", async () => {
    const callTool = vi.fn().mockResolvedValue({ ok: true });
    const qm = createQueryManager({ callTool } as ToolProvider);

    qm.evaluateQueries([node("q1", 5)]);
    await flushMicrotasks();
    const afterMount = callTool.mock.calls.length;

    await vi.advanceTimersByTimeAsync(5_000);
    await flushMicrotasks();
    expect(callTool.mock.calls.length).toBeGreaterThan(afterMount);

    const afterFirstTick = callTool.mock.calls.length;
    await vi.advanceTimersByTimeAsync(5_000);
    await flushMicrotasks();
    expect(callTool.mock.calls.length).toBeGreaterThan(afterFirstTick);
  });

  it("re-creates the refresh timer after dispose() + re-evaluate (StrictMode re-attach)", async () => {
    const callTool = vi.fn().mockResolvedValue({ ok: true });
    const qm = createQueryManager({ callTool } as ToolProvider);

    // Mount 1
    qm.evaluateQueries([node("q1", 5)]);
    await flushMicrotasks();

    // StrictMode cleanup
    qm.dispose();

    // StrictMode re-attach
    qm.activate();
    qm.evaluateQueries([node("q1", 5)]);
    await flushMicrotasks();

    const before = callTool.mock.calls.length;

    // Advance one interval. Before the fix this was a no-op because the
    // guard `newInterval !== q.refreshInterval` stayed false after dispose
    // (which cleared the timer but left refreshInterval at 5), so no new
    // timer was ever set up. After the fix, the timer ticks again.
    await vi.advanceTimersByTimeAsync(5_000);
    await flushMicrotasks();

    expect(callTool.mock.calls.length).toBeGreaterThan(before);
  });

  it("clears the timer when the interval is removed", async () => {
    const callTool = vi.fn().mockResolvedValue({ ok: true });
    const qm = createQueryManager({ callTool } as ToolProvider);

    qm.evaluateQueries([node("q1", 5)]);
    await flushMicrotasks();

    // Drop the refresh interval
    qm.evaluateQueries([node("q1", 0)]);
    await flushMicrotasks();

    const before = callTool.mock.calls.length;
    await vi.advanceTimersByTimeAsync(30_000);
    await flushMicrotasks();
    expect(callTool.mock.calls.length).toBe(before);
  });
});
