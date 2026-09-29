import { describe, expect, it } from "vitest";
import {
  advanceVector,
  morphAimMode,
  retargetVector,
  vectorAtRest,
  type VectorSpringState,
} from "./dataMorph";
import { springPresets } from "./presets";
import { advance, type SpringState } from "./spring";

const cfg = springPresets.dataMorph;
const DT = 1 / 60;

function mkState(values: number[], targets = values): VectorSpringState {
  return {
    values: Float64Array.from(values),
    velocities: new Float64Array(values.length),
    targets: Float64Array.from(targets),
  };
}

describe("advanceVector / vectorAtRest", () => {
  it("converges every scalar to its target and settles in finite steps", () => {
    const state = mkState([0, 50, -20], [100, 50, 30]);
    let steps = 0;
    for (; steps < 2000 && !vectorAtRest(state, cfg); steps++) {
      advanceVector(state, DT, cfg);
    }
    expect(steps).toBeLessThan(2000);
    expect(state.values[0]).toBeCloseTo(100, 0);
    expect(state.values[1]).toBeCloseTo(50, 1);
    expect(state.values[2]).toBeCloseTo(30, 0);
  });

  it("is component-wise identical to the scalar spring physics", () => {
    const vector = mkState([0], [100]);
    const scalar: SpringState = { value: 0, velocity: 0, target: 100 };
    for (let i = 0; i < 30; i++) {
      advanceVector(vector, DT, cfg);
      advance(scalar, DT, cfg);
      expect(vector.values[0]).toBeCloseTo(scalar.value, 12);
      expect(vector.velocities[0]).toBeCloseTo(scalar.velocity, 12);
    }
  });
});

describe("retargetVector", () => {
  it("same length: keeps live values + velocities, only targets move", () => {
    const state = mkState([10, 20], [50, 60]);
    advanceVector(state, DT, cfg); // pick up some velocity
    const midValues = [...state.values];
    const midVelocities = [...state.velocities];
    const next = retargetVector(state, [70, 80]);
    expect(next.resized).toBe(false);
    expect(next.state).toBe(state);
    expect([...next.state.values]).toEqual(midValues);
    expect([...next.state.velocities]).toEqual(midVelocities);
    expect([...next.state.targets]).toEqual([70, 80]);
  });

  it("length change: rebuilds snapped AT the targets (no correspondence)", () => {
    const state = mkState([10, 20], [50, 60]);
    const next = retargetVector(state, [1, 2, 3, 4]);
    expect(next.resized).toBe(true);
    expect([...next.state.values]).toEqual([1, 2, 3, 4]);
    expect([...next.state.velocities]).toEqual([0, 0, 0, 0]);
  });

  it("no prior state: snaps at the targets", () => {
    const next = retargetVector(null, [5, 6]);
    expect(next.resized).toBe(true);
    expect([...next.state.values]).toEqual([5, 6]);
  });
});

describe("morphAimMode (the snap-vs-glide decision)", () => {
  it.each([
    // snapRequested, reducedMotion, resized → mode
    [false, false, false, "glide"],
    [true, false, false, "snap"], // isAnimationActive off / printing
    [false, true, false, "snap"], // prefers-reduced-motion
    [false, false, true, "snap"], // point count changed
    [true, true, true, "snap"],
  ] as const)("snap=%s reduced=%s resized=%s → %s", (snap, reduced, resized, mode) => {
    expect(morphAimMode(snap, reduced, resized)).toBe(mode);
  });
});

describe("per-frame retarget churn (the streaming freeze scenario)", () => {
  it("keeps moving toward the target when retargeted EVERY frame", () => {
    // The CSS `transition: d` failure mode: a restart per frame re-sampled
    // progress 0 forever, so the rendered value never moved. The spring must
    // make real progress under the same churn: retarget every frame (fresh
    // targets array identity, jittering values), advance one frame, repeat.
    let state = retargetVector(null, [0]).state;
    state.values[0] = 0; // start away from the target band around 100
    const positions: number[] = [];
    for (let frame = 0; frame < 120; frame++) {
      const jitter = frame % 2 === 0 ? 2 : -2;
      state = retargetVector(state, [100 + jitter]).state;
      advanceVector(state, DT, cfg);
      positions.push(state.values[0]!);
    }
    // Liveness: visible progress within the first 10 frames (~166ms), unlike
    // the pinned-at-0 CSS restart.
    expect(positions[9]!).toBeGreaterThan(5);
    // Convergence: after 2s of churn the value sits inside the jitter band.
    expect(Math.abs(positions.at(-1)! - 100)).toBeLessThan(5);
    // Monotone-ish liveness: every frame in the approach phase moved.
    for (let i = 1; i < 30; i++) {
      expect(positions[i]!).not.toBe(positions[i - 1]!);
    }
  });
});
