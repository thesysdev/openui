import { describe, expect, it, vi } from "vitest";
import {
  advanceStreamingObservability,
  createStreamingObservabilityState,
} from "./useStreamingObservability";

describe("streaming observability lifecycle", () => {
  it("does not create an event for content that was never streamed", () => {
    const state = createStreamingObservabilityState();
    const idFactory = vi.fn(() => "stream-1");

    expect(
      advanceStreamingObservability(state, false, 'root = Card("done")', "[]", idFactory),
    ).toBeNull();
    expect(idFactory).not.toHaveBeenCalled();
  });

  it("uses one stable id for every update and the settled event", () => {
    const state = createStreamingObservabilityState();
    const idFactory = vi.fn(() => "stream-1");

    expect(advanceStreamingObservability(state, true, "root = Car", null, idFactory)).toEqual({
      id: "stream-1",
      phase: "streaming",
      updateIndex: 1,
    });
    expect(
      advanceStreamingObservability(state, true, 'root = Card("done")', null, idFactory),
    ).toEqual({
      id: "stream-1",
      phase: "streaming",
      updateIndex: 2,
    });
    expect(
      advanceStreamingObservability(state, false, 'root = Card("done")', "[]", idFactory),
    ).toEqual({
      id: "stream-1",
      phase: "settled",
      updateIndex: 3,
    });
    expect(idFactory).toHaveBeenCalledOnce();
  });

  it("emits once per response and unchanged settled snapshot", () => {
    const state = createStreamingObservabilityState();
    const idFactory = () => "stream-1";

    expect(
      advanceStreamingObservability(state, true, "root = Car", null, idFactory),
    ).not.toBeNull();
    expect(advanceStreamingObservability(state, true, "root = Car", null, idFactory)).toBeNull();
    expect(
      advanceStreamingObservability(state, false, "root = Car", "[]", idFactory),
    ).not.toBeNull();
    expect(advanceStreamingObservability(state, false, "root = Car", "[]", idFactory)).toBeNull();
  });

  it("starts a new id when a settled Renderer streams again", () => {
    const state = createStreamingObservabilityState();
    const idFactory = vi
      .fn<() => string>()
      .mockReturnValueOnce("stream-1")
      .mockReturnValueOnce("stream-2");

    expect(advanceStreamingObservability(state, true, "first", null, idFactory)).toEqual({
      id: "stream-1",
      phase: "streaming",
      updateIndex: 1,
    });
    expect(advanceStreamingObservability(state, false, "first", "[]", idFactory)).toEqual({
      id: "stream-1",
      phase: "settled",
      updateIndex: 2,
    });
    expect(advanceStreamingObservability(state, true, "second", null, idFactory)).toEqual({
      id: "stream-2",
      phase: "streaming",
      updateIndex: 1,
    });
    expect(advanceStreamingObservability(state, false, "second", "[]", idFactory)).toEqual({
      id: "stream-2",
      phase: "settled",
      updateIndex: 2,
    });
    expect(idFactory).toHaveBeenCalledTimes(2);
  });

  it("does not start a new id when a settled Renderer is marked streaming with the same response", () => {
    const state = createStreamingObservabilityState();
    const idFactory = vi.fn(() => "stream-1");

    advanceStreamingObservability(state, true, "first", null, idFactory);
    advanceStreamingObservability(state, false, "first", "[]", idFactory);

    expect(advanceStreamingObservability(state, true, "first", null, idFactory)).toBeNull();
    expect(idFactory).toHaveBeenCalledOnce();
  });

  it("republishes settled with a new updateIndex when the error snapshot changes", () => {
    const state = createStreamingObservabilityState();
    const idFactory = () => "stream-1";

    advanceStreamingObservability(state, true, "root = Card()", null, idFactory);
    advanceStreamingObservability(state, false, "root = Card()", "[]", idFactory);

    expect(
      advanceStreamingObservability(
        state,
        false,
        "root = Card()",
        '[{"code":"query-error"}]',
        idFactory,
      ),
    ).toEqual({
      id: "stream-1",
      phase: "settled",
      updateIndex: 3,
    });
    expect(
      advanceStreamingObservability(
        state,
        false,
        "root = Card()",
        '[{"code":"query-error"}]',
        idFactory,
      ),
    ).toBeNull();
    expect(
      advanceStreamingObservability(
        state,
        false,
        "root = Card()",
        '[{"code":"query-error"},{"code":"tool-failed"}]',
        idFactory,
      ),
    ).toEqual({ id: "stream-1", phase: "settled", updateIndex: 4 });
  });
});
