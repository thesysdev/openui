// Ported from @openuidev/react-ui (components/Charts/shared/core/spring/useDataMorph.ts), where it is
// internal. Keep the two in step; prefer importing it once react-ui exports it.

// React hook over `createDataMorph`, mirroring useSpring's ref discipline: the
// morph lives in a ref, retargeting never re-renders React, and the shared
// ticker drops it on unmount.
//
// The morph is created LAZILY, on the first aim of an ANIMATED chart. While
// animation is off (`isAnimationActive={false}`, what every c1 surface
// passes), no morph exists at all: React's own `d`/`cx`/`cy` attribute commit
// IS the snapped geometry, so the streaming hot path costs nothing beyond the
// render it already paid for. An animated chart's first aim snaps (mount), and
// still creates the morph so it holds that geometry: the first data change
// then glides from it, where a morph born on that change would have no state
// to glide from and snap again. Once a morph exists every snap runs through it
// — the DOM may hold mid-glide geometry that React's props no longer describe.

import { useEffect, useRef } from "react";
import { createDataMorph, type DataMorph } from "./dataMorph";
import type { SpringConfig } from "./spring";

/**
 * Aim the morph at `targets`. `snap` jumps there (mount, resize, animation
 * off); `animated` is whether the chart animates at all (default true) — while
 * it is false and nothing has glided, no morph is created.
 */
export type DataMorphAim = (targets: ArrayLike<number>, snap: boolean, animated?: boolean) => void;

export function useDataMorph(
  config: SpringConfig,
  onUpdate: (values: Float64Array) => void,
): DataMorphAim {
  // Keep `onUpdate` fresh without recreating the morph.
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const configRef = useRef(config);
  configRef.current = config;

  const morphRef = useRef<DataMorph | null>(null);

  // Live retune (parity with useSpring) — only relevant once a morph exists.
  useEffect(() => {
    morphRef.current?.setConfig(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the scalar fields, not `config` itself: callers pass inline object literals, so object identity churns every render while the values are what matter
  }, [config.stiffness, config.damping, config.restDelta, config.restSpeed]);

  // Teardown: detach from the shared ticker (no leaked loop).
  useEffect(() => {
    return () => morphRef.current?.stop();
  }, []);

  // Stable aim (delegates through refs) so layout effects can depend on it
  // without churn.
  const aimRef = useRef<DataMorphAim | null>(null);
  if (aimRef.current === null) {
    aimRef.current = (targets, snap, animated = true) => {
      if (morphRef.current === null) {
        // No morph yet + snapping with animation off: React committed these
        // targets as attributes this very render — nothing to do.
        if ((snap && !animated) || typeof window === "undefined") return;
        morphRef.current = createDataMorph(configRef.current, (values) =>
          onUpdateRef.current(values),
        );
      }
      morphRef.current.aim(targets, snap);
    };
  }
  return aimRef.current;
}
