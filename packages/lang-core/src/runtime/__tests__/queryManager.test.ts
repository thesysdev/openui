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

describe("QueryManager waitFor", () => {
  const q = (
    statementId: string,
    toolName: string,
    args: unknown,
    waitFor?: string[],
  ): QueryNode => ({
    statementId,
    toolName,
    args,
    defaults: null,
    deps: null,
    complete: true,
    waitFor,
  });

  it("does not fetch a query until every query it waits for has a result", async () => {
    let release!: (v: unknown) => void;
    const callTool = vi.fn((tool: string) =>
      tool === "a" ? new Promise((r) => (release = r)) : Promise.resolve("b-data"),
    );
    const qm = createQueryManager({ callTool } as ToolProvider);
    qm.evaluateQueries([q("qa", "a", {}), q("qb", "b", { x: null }, ["qa"])]);
    await flushMicrotasks();
    expect(callTool.mock.calls.map((c) => c[0])).toEqual(["a"]);
    expect(qm.getSnapshot().__openui_loading).toEqual(["qa", "qb"]);

    release([1]);
    await flushMicrotasks();
    qm.evaluateQueries([q("qa", "a", {}), q("qb", "b", { x: [1] }, ["qa"])]);
    await flushMicrotasks();
    expect(callTool.mock.calls).toEqual([
      ["a", {}],
      ["b", { x: [1] }],
    ]);
  });

  it("does not report a query as loading when what it waits for failed or reads it back, nor refetch it", async () => {
    const callTool = vi.fn().mockRejectedValue(new Error("down"));
    const qm = createQueryManager({ callTool } as ToolProvider);
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const nodes = [
      q("qa", "a", {}),
      q("qb", "b", { x: null }, ["qa"]),
      q("c1", "c", { x: null }, ["c2"]),
      q("c2", "c", { x: null }, ["c1"]),
    ];
    qm.evaluateQueries(nodes);
    expect(qm.getSnapshot().__openui_loading).toEqual(["qa", "qb"]);
    await flushMicrotasks();
    qm.evaluateQueries(nodes);
    await flushMicrotasks();
    expect(qm.getSnapshot().__openui_loading).toEqual([]);
    qm.invalidate(["qb", "c1"]);
    expect(callTool.mock.calls.map((c) => c[0])).toEqual(["a", "a"]);
    quiet.mockRestore();
  });
});
