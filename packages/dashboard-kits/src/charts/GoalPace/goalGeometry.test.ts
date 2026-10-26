import { describe, expect, it } from "vitest";
import type { Goal } from "../../core/schemas";
import { chanceOfGoal, gaugeAngle, gaugeArc, gaugeMarker, goalStatus } from "./goalGeometry";

const goal = (target: number, cumulative: number[], days = 30): Goal => ({
  label: "Goal",
  goal: target,
  labels: Array.from({ length: days }, (_, i) => `D${i + 1}`),
  cumulative,
});

describe("goalStatus", () => {
  it("projects the finish from the pace so far", () => {
    const s = goalStatus(goal(3000, [100, 200, 300], 30));
    expect(s.projected).toBe(3000);
    expect(s.pace).toBeCloseTo(0);
    expect(s.tone).toBe("good");
    expect(s.neededPerDay).toBe(100);
  });

  it("reads a small shortfall as close and a large one as behind", () => {
    expect(goalStatus(goal(3100, [100, 200, 300])).tone).toBe("warn");
    expect(goalStatus(goal(4000, [100, 200, 300])).tone).toBe("bad");
  });

  it("stops asking for a daily figure once the period is over", () => {
    expect(goalStatus(goal(10, [5, 10], 2)).neededPerDay).toBeUndefined();
  });
});

describe("gauge geometry", () => {
  it("sweeps from -135° to +135°, clamping overshoot", () => {
    expect(gaugeAngle(0)).toBeCloseTo(-0.75 * Math.PI);
    expect(gaugeAngle(1)).toBeCloseTo(0.75 * Math.PI);
    expect(gaugeAngle(1.4)).toBeCloseTo(gaugeAngle(1));
    expect(gaugeAngle(Number.NaN)).toBeCloseTo(gaugeAngle(0));
  });

  it("draws the filled arc as a closed d3 arc", () => {
    const d = gaugeArc(0.5, 41, 51);
    expect(d.startsWith("M")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(gaugeArc(0, 41, 51)).not.toBe(d);
  });

  it("puts the 50% marker at the top of the gauge", () => {
    const m = gaugeMarker(0.5, 46);
    expect(m.x1).toBeCloseTo(0);
    expect(m.x2).toBeCloseTo(0);
    expect(m.y1).toBeCloseTo(-37);
    expect(m.y2).toBeCloseTo(-55);
  });
});

describe("chanceOfGoal", () => {
  it("is even when the forecast lands on the goal, and grows as it clears it", () => {
    expect(chanceOfGoal(100, 90, 110, 100)).toBeCloseTo(0.5, 6);
    // The goal at the range's low edge: 90% of an 80% interval's spread lies above it.
    expect(chanceOfGoal(100, 90, 110, 90)).toBeCloseTo(0.9, 3);
    expect(chanceOfGoal(100, 90, 110, 110)).toBeCloseTo(0.1, 3);
  });

  it("is certain either way without a spread", () => {
    expect(chanceOfGoal(100, 100, 100, 99)).toBe(1);
    expect(chanceOfGoal(100, 100, 100, 101)).toBe(0);
  });
});
