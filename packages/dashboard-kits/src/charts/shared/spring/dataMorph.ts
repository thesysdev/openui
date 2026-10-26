// Ported from @openuidev/react-ui (components/Charts/shared/core/spring/dataMorph.ts), where it is
// internal. Keep the two in step; prefer importing it once react-ui exports it.

// The data morph: N scalars (a series' pixel geometry, flattened) springing
// toward retargetable targets, sharing ONE ticker registration. This is what
// animates a line/area series between data states — the job the CSS
// `transition: d` used to do, minus its failure mode: a restarted CSS tween
// re-samples from progress 0 on every `d` write, so per-frame streaming
// rewrites starved it and the rendered geometry froze. A spring retargets
// from its live position + velocity, so the same churn converges instead.
//
// Layering mirrors spring.ts: `advanceVector` / `vectorAtRest` /
// `retargetVector` / `morphAimMode` are PURE (unit-tested with fixed dt);
// `createDataMorph` is the runtime wrapper wiring them to the shared ticker
// and an `onUpdate` callback (the series component regenerates its `d` string
// there). Component-wise the physics IS spring.ts's `advance`, applied per
// scalar — one tuning table, one behavior.

import { advance, isAtRest, type SpringConfig, type SpringState } from "./spring";
import { registerTick, unregisterTick } from "./ticker";

export interface VectorSpringState {
  values: Float64Array;
  velocities: Float64Array;
  targets: Float64Array;
}

export interface DataMorph {
  /**
   * Retarget toward `targets`. `snap` forces an instant jump (the
   * `isAnimationActive={false}` path — no ticker work at all). A length
   * change also snaps: geometry with a different point count has no
   * correspondence to glide along (the CSS tween jumped there too).
   */
  aim(targets: ArrayLike<number>, snap?: boolean): void;
  /** Retune live without recreating. */
  setConfig(config: SpringConfig): void;
  /** Stop and detach from the ticker. Idempotent. */
  stop(): void;
}

// Scratch state so advanceVector reuses spring.ts's `advance` (the exact same
// integration, substepping and clamping) without per-scalar allocation.
const scratch: SpringState = { value: 0, velocity: 0, target: 0 };

/**
 * Advance every scalar by `dt` seconds under `config`. Component-wise
 * identical to spring.ts's `advance`. Pure: mutates and returns `state`.
 *
 * A scalar whose value or target is not finite (NaN marks a gap in a line, or
 * a mark with nothing to place) has no distance to spring across: it snaps to
 * its target, so the gap opens or closes at once and never keeps the morph
 * running.
 */
export function advanceVector(
  state: VectorSpringState,
  dt: number,
  config: SpringConfig,
): VectorSpringState {
  for (let i = 0; i < state.values.length; i++) {
    if (!Number.isFinite(state.values[i]!) || !Number.isFinite(state.targets[i]!)) {
      state.values[i] = state.targets[i]!;
      state.velocities[i] = 0;
      continue;
    }
    scratch.value = state.values[i]!;
    scratch.velocity = state.velocities[i]!;
    scratch.target = state.targets[i]!;
    advance(scratch, dt, config);
    state.values[i] = scratch.value;
    state.velocities[i] = scratch.velocity;
  }
  return state;
}

/**
 * Whether EVERY scalar is within its rest thresholds (the slowest one gates).
 * A non-finite scalar is at rest once it sits on its target (NaN on NaN), the
 * state advanceVector snaps it to.
 */
export function vectorAtRest(state: VectorSpringState, config: SpringConfig): boolean {
  for (let i = 0; i < state.values.length; i++) {
    if (!Number.isFinite(state.values[i]!) || !Number.isFinite(state.targets[i]!)) {
      if (Object.is(state.values[i], state.targets[i])) continue;
      return false;
    }
    scratch.value = state.values[i]!;
    scratch.velocity = state.velocities[i]!;
    scratch.target = state.targets[i]!;
    if (!isAtRest(scratch, config)) return false;
  }
  return true;
}

/**
 * Point the state at `targets`. Same length → glide (values + velocities
 * survive, only targets move — the retarget-from-flight property). Different
 * length (or no state yet) → rebuild snapped AT the targets, since old and
 * new geometry have no point correspondence. Pure.
 */
export function retargetVector(
  state: VectorSpringState | null,
  targets: ArrayLike<number>,
): { state: VectorSpringState; resized: boolean } {
  if (state === null || state.values.length !== targets.length) {
    return {
      state: {
        values: Float64Array.from(targets),
        velocities: new Float64Array(targets.length),
        targets: Float64Array.from(targets),
      },
      resized: true,
    };
  }
  state.targets.set(targets);
  return { state, resized: false };
}

/**
 * The snap-vs-glide decision, in one testable place:
 * snap when the caller says so (`isAnimationActive` off — the default and
 * every c1 surface — or printing, folded upstream by useEffectiveAnimation),
 * when the user prefers reduced motion, or when the point count changed.
 */
export function morphAimMode(
  snapRequested: boolean,
  reducedMotion: boolean,
  resized: boolean,
): "snap" | "glide" {
  return snapRequested || reducedMotion || resized ? "snap" : "glide";
}

// Cached MediaQueryList: aim() runs per data tick (every frame under
// streaming), so unlike spring.ts's per-create probe this one must not
// allocate per call. `undefined` = not probed yet, `null` = unavailable.
let reducedMotionQuery: MediaQueryList | null | undefined;
function prefersReducedMotion(): boolean {
  if (reducedMotionQuery === undefined) {
    reducedMotionQuery =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
  }
  return reducedMotionQuery?.matches ?? false;
}

export function createDataMorph(
  config: SpringConfig,
  onUpdate: (values: Float64Array) => void,
): DataMorph {
  let state: VectorSpringState | null = null;
  let cfg = config;
  let running = false;

  const tick = (dt: number): boolean => {
    if (state === null) {
      running = false;
      return false;
    }
    advanceVector(state, dt, cfg);
    if (vectorAtRest(state, cfg)) {
      state.values.set(state.targets);
      state.velocities.fill(0);
      onUpdate(state.values);
      running = false;
      return false; // settled → deregister
    }
    onUpdate(state.values);
    return true;
  };

  return {
    aim(targets, snap = false) {
      const next = retargetVector(state, targets);
      state = next.state;
      if (morphAimMode(snap, prefersReducedMotion(), next.resized) === "snap") {
        state.values.set(state.targets);
        state.velocities.fill(0);
        if (running) {
          running = false;
          unregisterTick(tick);
        }
        onUpdate(state.values);
        return;
      }
      // Write the CURRENT animated values synchronously: aim() runs in a
      // layout effect right after React committed the new target `d`, so this
      // pre-paint write is what keeps a mid-glide retarget from flashing the
      // target for one frame.
      onUpdate(state.values);
      if (!vectorAtRest(state, cfg) && !running) {
        running = true;
        registerTick(tick);
      }
    },
    setConfig(next) {
      cfg = next;
    },
    stop() {
      running = false;
      unregisterTick(tick);
    },
  };
}
