"use client";

import { useEffect, useRef, useState } from "react";

/** The renderer's easing for things that arrive. */
const EASE_OUT = "cubic-bezier(0.2, 0.8, 0.2, 1)";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

const DRIFT = 200;

/** Text that swaps with a drift: the old line rises and fades, the new one rises in. */
export function AnimatedLabel({ text, className }: { text: string; className?: string }) {
  const [shown, setShown] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (text === shown) return;
    if (!el?.animate || prefersReducedMotion() || document.hidden) {
      setShown(text);
      return;
    }
    const out = el.animate([{ opacity: 1 }, { opacity: 0, translate: "0 -5px" }], {
      duration: DRIFT,
      fill: "forwards",
    });
    // A timer, not `out.finished`: a page that isn't painting may never finish the animation.
    const swap = setTimeout(() => {
      out.cancel();
      setShown(text);
      el.animate(
        [
          { opacity: 0, translate: "0 5px" },
          { opacity: 1, translate: "0 0" },
        ],
        { duration: DRIFT, easing: EASE_OUT },
      );
    }, DRIFT);
    // The text changed again, or went back: drop the fade so the line stays visible.
    return () => {
      clearTimeout(swap);
      out.cancel();
    };
  }, [text, shown]);

  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}
