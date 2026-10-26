import { describe, expect, it } from "vitest";
import { statusCounts } from "./trackerUtils";

describe("statusCounts", () => {
  it("counts each status in legend order and drops empty ones", () => {
    const counts = statusCounts([
      { label: "a", status: "bad" },
      { label: "b", status: "good" },
      { label: "c", status: "good" },
      { label: "d", status: "none" },
    ]);
    expect(counts.map((c) => [c.status, c.count])).toEqual([
      ["good", 2],
      ["bad", 1],
      ["none", 1],
    ]);
  });

  it("names a status by its blocks' shared detail, else by the default", () => {
    const counts = statusCounts([
      { label: "a", status: "bad", detail: "Alerting" },
      { label: "b", status: "bad", detail: "Alerting" },
      { label: "c", status: "good", detail: "Clear" },
      { label: "d", status: "good", detail: "Fine" },
    ]);
    expect(counts.map((c) => c.label)).toEqual(["Met target", "Alerting"]);
  });
});
