"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Mascot } from "./mascot";

/*
 * InputIntro: plays the chat input's entrance once. The mascot pops in at the centre,
 * then glides left to its seat in the input while the input opens outward from the
 * centre behind it. Wrap the RadioInput with it; the input itself is untouched.
 * With autoFocus, the text field takes focus as the mascot lands.
 */
const INTRO_MS = 840;

export function InputIntro({ children, autoFocus = false }: { children: ReactNode; autoFocus?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [land, setLand] = useState<{ x: number; y: number; size: number; from: number } | null>(null);

  useLayoutEffect(() => {
    const box = ref.current;
    const seat = box?.querySelector<HTMLElement>(".mascot");
    if (!box || !seat) return;
    const b = box.getBoundingClientRect();
    const m = seat.getBoundingClientRect();
    const x = m.left - b.left;
    setLand({ x, y: m.top - b.top, size: m.width, from: b.width / 2 - m.width / 2 - x });
  }, []);

  useEffect(() => {
    if (!autoFocus) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(
      () => ref.current?.querySelector<HTMLInputElement>("input, textarea")?.focus({ preventScroll: true }),
      reduced ? 0 : INTRO_MS,
    );
    return () => clearTimeout(timer);
  }, [autoFocus]);

  const vars = land
    ? ({ "--land-x": `${land.x}px`, "--land-y": `${land.y}px`, "--from-x": `${land.from}px` } as CSSProperties)
    : undefined;

  return (
    <div ref={ref} className="input-intro" data-play={land ? "" : undefined} style={vars}>
      <div className="input-intro__body">{children}</div>
      {land && (
        <span className="input-intro__mascot" aria-hidden>
          <Mascot size={land.size} alt="" />
        </span>
      )}
    </div>
  );
}
