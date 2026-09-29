// React hook over `createSpring`. The spring lives in a ref (created once, never
// recreated), so retargeting it from a pointer handler never re-renders React —
// the continuous motion runs entirely off the render path. Config retunes live;
// the spring stops (and the shared ticker drops it) on unmount.

import { useEffect, useRef } from "react";
import { createSpring, type Spring, type SpringConfig } from "./spring";

export interface SpringHandle {
  set(target: number): void;
  jump(value: number): void;
}

export function useSpring(
  config: SpringConfig,
  onUpdate: (value: number) => void,
  initial = 0,
): SpringHandle {
  // Keep `onUpdate` fresh without recreating the spring.
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const springRef = useRef<Spring | null>(null);
  if (springRef.current === null && typeof window !== "undefined") {
    springRef.current = createSpring(initial, config, (v) => onUpdateRef.current(v));
  }

  // Live retune — change responsiveness without recreating / restarting.
  useEffect(() => {
    springRef.current?.setConfig(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the scalar fields, not `config` itself: callers pass inline object literals, so object identity churns every render while the values are what matter
  }, [config.stiffness, config.damping, config.restDelta, config.restSpeed]);

  // Teardown: stop the spring so the shared ticker drops it (no leaked loop).
  useEffect(() => {
    const spring = springRef.current;
    return () => spring?.stop();
  }, []);

  // Stable handle (delegates to the ref) so consumers can keep it out of deps and
  // ref callbacks built on it don't churn every render.
  const handleRef = useRef<SpringHandle | null>(null);
  if (handleRef.current === null) {
    handleRef.current = {
      set: (target) => springRef.current?.set(target),
      jump: (value) => springRef.current?.jump(value),
    };
  }
  return handleRef.current;
}
