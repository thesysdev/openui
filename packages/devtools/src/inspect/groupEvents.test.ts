import type { ObservabilityEvent } from "@openuidev/observability";
import { describe, expect, it } from "vitest";
import { displayEventKind, groupEventsByRunId, runGroupLevel, runGroupTitle } from "./groupEvents";

function event(
  detail: Record<string, unknown>,
  extra: Partial<ObservabilityEvent> = {},
): ObservabilityEvent {
  return {
    level: extra.level ?? "info",
    timestamp: extra.timestamp ?? 1,
    detail: { kind: "x", ...detail },
  };
}

describe("groupEventsByRunId", () => {
  it("titles a run from the user message on LLM:request", () => {
    const items = groupEventsByRunId([
      event(
        {
          kind: "LLM:request",
          runId: "run-1",
          userMessage: { role: "user", content: "Who waited?" },
        },
        { timestamp: 1 },
      ),
      event({ kind: "LLM:response", runId: "run-1", status: 200 }, { timestamp: 2 }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ type: "run", runId: "run-1" });
    expect(runGroupTitle(items[0]!.type === "run" ? items[0].events : [])).toBe("Who waited?");
  });

  it("keeps distinct Renderer streams within the same run", () => {
    const items = groupEventsByRunId([
      event({ kind: "LLM:request", runId: "run-1" }, { timestamp: 1 }),
      event(
        { kind: "react-lang:stream", runId: "run-1", id: "s-old", phase: "settled" },
        { timestamp: 2 },
      ),
      event(
        { kind: "react-lang:stream", runId: "run-1", id: "s-new", phase: "settled" },
        { timestamp: 3 },
      ),
    ]);
    const run = items[0];
    expect(run?.type).toBe("run");
    if (run?.type !== "run") return;
    const streams = run.events.filter((item) => item.detail["kind"] === "react-lang:stream");
    expect(streams.map((stream) => stream.detail["id"])).toEqual(["s-old", "s-new"]);
  });

  it("orders request, then response, then stream", () => {
    const items = groupEventsByRunId([
      event({ kind: "react-lang:stream", runId: "run-1", id: "s1" }, { timestamp: 30 }),
      event({ kind: "LLM:response", runId: "run-1" }, { timestamp: 20 }),
      event({ kind: "LLM:request", runId: "run-1" }, { timestamp: 10 }),
    ]);
    const run = items[0];
    expect(run?.type).toBe("run");
    if (run?.type !== "run") return;
    expect(run.events.map((item) => item.detail["kind"])).toEqual([
      "LLM:request",
      "LLM:response",
      "react-lang:stream",
    ]);
  });
});

describe("runGroupLevel", () => {
  it("surfaces the worst level in the group, including stream parse errors", () => {
    expect(
      runGroupLevel([
        event({ kind: "LLM:request", runId: "run-1" }),
        event({ kind: "LLM:response", runId: "run-1", status: 200 }),
        event({ kind: "react-lang:stream", runId: "run-1" }, { level: "error" }),
      ]),
    ).toBe("error");
    expect(
      runGroupLevel([
        event({ kind: "LLM:request", runId: "run-1" }),
        event({ kind: "LLM:error", runId: "run-1" }, { level: "error" }),
        event({ kind: "react-lang:stream", runId: "run-1" }),
      ]),
    ).toBe("error");
  });
});

describe("displayEventKind", () => {
  it("uses plain-language labels for LLM rows", () => {
    expect(displayEventKind("LLM:request")).toBe("Request sent");
    expect(displayEventKind("LLM:response")).toBe("Response received");
    expect(displayEventKind("LLM:error")).toBe("Request failed");
  });
});
