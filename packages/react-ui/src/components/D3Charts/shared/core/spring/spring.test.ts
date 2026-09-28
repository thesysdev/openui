import { describe, expect, it } from "vitest";
import { advance, isAtRest, type SpringConfig, type SpringState } from "./spring";

// Critically-ish damped config (ζ ≈ 0.9), matching how a page maps a slider.
const cfg = (stiffness: number): SpringConfig => ({
  stiffness,
  damping: 2 * Math.sqrt(stiffness) * 0.9,
});

function simulate(stiffness: number, target: number, fps = 60) {
  const config = cfg(stiffness);
  const state: SpringState = { value: 0, velocity: 0, target };
  let steps = 0;
  let maxValue = 0;
  for (; steps < 2000; steps++) {
    advance(state, 1 / fps, config);
    maxValue = Math.max(maxValue, state.value);
    if (isAtRest(state, config)) break;
  }
  return { steps, value: state.value, maxValue };
}

describe("spring physics", () => {
  it("converges to the target and settles in finite steps", () => {
    for (const k of [120, 300, 640]) {
      const { steps, value } = simulate(k, 100);
      expect(steps).toBeLessThan(2000);
      expect(value).toBeCloseTo(100, 1);
    }
  });

  it("does not overshoot meaningfully at ζ ≈ 0.9", () => {
    const { maxValue } = simulate(300, 100);
    expect(maxValue).toBeLessThan(100 * 1.05);
  });

  it("stays finite under a large (clamped) frame gap", () => {
    const config = cfg(300);
    const state: SpringState = { value: 0, velocity: 0, target: 100 };
    advance(state, 5, config);
    expect(Number.isFinite(state.value)).toBe(true);
  });

  it("isAtRest reflects distance + speed thresholds", () => {
    const config = cfg(300);
    expect(isAtRest({ value: 0, velocity: 0, target: 100 }, config)).toBe(false);
    expect(isAtRest({ value: 100, velocity: 0, target: 100 }, config)).toBe(true);
    expect(isAtRest({ value: 100, velocity: 5, target: 100 }, config)).toBe(false);
  });
});
