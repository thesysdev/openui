// The spring primitive: a scalar value that eases toward a target, retargetable
// at any time, driven by the shared ticker. This is the whole "engine" — bklit
// gets the equivalent from Framer's `useSpring`; here it's ~one file, dep-free.
//
// `advance` and `isAtRest` are PURE (no rAF, no DOM) so the physics can be
// verified deterministically — step with a fixed dt and assert convergence.
// `createSpring` is the runtime wrapper that wires that physics to the ticker and
// an `onUpdate` callback (the caller decides what to do with the value: translate
// an element, regenerate an arc path, set opacity, …).

import { registerTick, unregisterTick } from "./ticker";

export interface SpringConfig {
  stiffness: number;
  damping: number;
  /** Distance from target below which (with low speed) the spring settles. Default 0.01. */
  restDelta?: number;
  /** Speed below which (near the target) the spring settles. Default 0.01. */
  restSpeed?: number;
}

export interface SpringState {
  value: number;
  velocity: number;
  target: number;
}

export interface Spring {
  /** Retarget; the value springs toward `target`. */
  set(target: number): void;
  /** Snap to `value` instantly (no animation), e.g. to seed position on first show. */
  jump(value: number): void;
  get(): number;
  /** Retune live without recreating (changing responsiveness mid-flight). */
  setConfig(config: SpringConfig): void;
  /** Stop and detach from the ticker. Idempotent. */
  stop(): void;
}

/** Fixed substep (s) — integrate in small steps so behaviour is frame-rate
 *  independent and stable even when a frame is late (tab refocus). */
const FIXED_STEP = 1 / 120;
/** Clamp a single frame's dt (s) so a long gap can't explode the integration. */
const MAX_FRAME = 0.064;

/**
 * Advance `state` by `dt` seconds under `config` (semi-implicit Euler, substepped).
 * Pure: mutates and returns `state`, touches nothing else. Unit-test this directly.
 */
export function advance(state: SpringState, dt: number, config: SpringConfig): SpringState {
  const k = config.stiffness;
  const c = config.damping;
  let remaining = Math.min(dt, MAX_FRAME);
  while (remaining > 0) {
    const h = Math.min(FIXED_STEP, remaining);
    const force = -k * (state.value - state.target) - c * state.velocity;
    state.velocity += force * h; // update velocity first …
    state.value += state.velocity * h; // … then position with the new velocity
    remaining -= h;
  }
  return state;
}

/** Whether the spring is within its rest thresholds of the target. */
export function isAtRest(state: SpringState, config: SpringConfig): boolean {
  const restDelta = config.restDelta ?? 0.01;
  const restSpeed = config.restSpeed ?? 0.01;
  return Math.abs(state.value - state.target) < restDelta && Math.abs(state.velocity) < restSpeed;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function createSpring(
  initial: number,
  config: SpringConfig,
  onUpdate: (value: number) => void,
): Spring {
  const state: SpringState = { value: initial, velocity: 0, target: initial };
  let cfg = config;
  let reduced = prefersReducedMotion();
  let running = false;

  const tick: (dt: number) => boolean = (dt) => {
    advance(state, dt, cfg);
    if (isAtRest(state, cfg)) {
      state.value = state.target;
      state.velocity = 0;
      onUpdate(state.value);
      running = false;
      return false; // settled → deregister; loop stops when nothing's left
    }
    onUpdate(state.value);
    return true;
  };

  const start = () => {
    if (!running) {
      running = true;
      registerTick(tick);
    }
  };

  return {
    set(target) {
      state.target = target;
      if (reduced) {
        // Respect reduced-motion: snap, never animate.
        state.value = target;
        state.velocity = 0;
        onUpdate(target);
        return;
      }
      if (state.value !== target || state.velocity !== 0) {
        start();
      }
    },
    jump(value) {
      state.value = value;
      state.target = value;
      state.velocity = 0;
      onUpdate(value);
    },
    get: () => state.value,
    setConfig(next) {
      cfg = next;
      reduced = prefersReducedMotion();
    },
    stop() {
      running = false;
      unregisterTick(tick);
    },
  };
}
