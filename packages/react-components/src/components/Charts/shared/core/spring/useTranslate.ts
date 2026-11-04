// Convenience over the scalar spring: drive one element's CSS `transform:
// translate(x, y)` from two springs. This is a THIN layer — the real primitive is
// the scalar `useSpring`; translate is just one thing you can do with the value.
// (The line/area dots spring an arc-length along the path, and the highlight band
// springs its x + width, directly via `useSpring` — proving the core isn't
// translate-bound.)

import { useRef } from "react";
import type { SpringConfig } from "./spring";
import { useSpring } from "./useSpring";

export interface TranslateHandle {
  /** Ref callback for the element to drive. */
  bind: (el: HTMLElement | SVGElement | null) => void;
  /** Spring toward (x, y). */
  to: (x: number, y: number) => void;
  /** Snap to (x, y) instantly. */
  jump: (x: number, y: number) => void;
}

export function useTranslate(config: SpringConfig): TranslateHandle {
  const elRef = useRef<HTMLElement | SVGElement | null>(null);
  const pos = useRef({ x: 0, y: 0 });

  const write = () => {
    const el = elRef.current;
    if (el) {
      el.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
    }
  };

  const sx = useSpring(config, (v) => {
    pos.current.x = v;
    write();
  });
  const sy = useSpring(config, (v) => {
    pos.current.y = v;
    write();
  });

  // Stable api (sx/sy are ref-backed handles, so this never needs to change).
  const apiRef = useRef<TranslateHandle | null>(null);
  if (apiRef.current === null) {
    apiRef.current = {
      bind: (el) => {
        elRef.current = el;
        write();
      },
      to: (x, y) => {
        sx.set(x);
        sy.set(y);
      },
      jump: (x, y) => {
        pos.current = { x, y };
        sx.jump(x);
        sy.jump(y);
        write();
      },
    };
  }
  return apiRef.current;
}
