import type { CSSProperties } from "react";

/* Time helpers for the How it works film. Everything is a pure function of the
   film time T (seconds), so any moment can be drawn on its own: paused,
   reduced motion, or a still for review. Curves follow the OUI-1 launch kit. */

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/* CSS-style cubic-bezier, solved for x with Newton steps. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const x = (t: number) => ((ax * t + bx) * t + cx) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (p: number) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 6; i++) {
      const slope = dx(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= (x(t) - p) / slope;
    }
    t = clamp01(t);
    return ((ay * t + by) * t + cy) * t;
  };
}

/* In-out: quick to leave, slow to land. */
export const ease = bezier(0.65, 0, 0.25, 1);
export const easeOut = bezier(0.16, 1, 0.3, 1);

/* 0 before a, 1 after b, eased between. */
export const ramp = (T: number, a: number, b: number, e: (p: number) => number = ease) =>
  b <= a ? (T >= b ? 1 : 0) : e(clamp01((T - a) / (b - a)));

/* An element arriving: it rises a little out of a short blur as it comes up. */
export function blurIn(T: number, at: number, dur = 0.45, rise = 6): CSSProperties | undefined {
  const p = ramp(T, at, at + dur, easeOut);
  if (p >= 1) return undefined;
  return {
    opacity: p,
    filter: `blur(${((1 - p) * 8).toFixed(2)}px)`,
    translate: `0 ${((1 - p) * rise).toFixed(2)}px`,
  };
}

/* A swap in place: the old value blurs away while the new one blurs in. */
export function blurSwap(T: number, at: number, dur = 0.5) {
  const p = ramp(T, at, at + dur, ease);
  const out = clamp01(p * 2);
  const inn = clamp01(p * 2 - 1);
  return {
    showNew: p >= 0.5,
    style:
      p <= 0 || p >= 1
        ? undefined
        : p < 0.5
          ? { opacity: 1 - out, filter: `blur(${(out * 6).toFixed(2)}px)` }
          : { opacity: inn, filter: `blur(${((1 - inn) * 6).toFixed(2)}px)` },
  };
}

/* A number counting between two values. */
export const count = (T: number, at: number, dur: number, from: number, to: number) =>
  Math.round(lerp(from, to, ramp(T, at, at + dur, easeOut)));

/* Text typed out over [a, b]. */
export const typed = (text: string, T: number, a: number, b: number) =>
  text.slice(0, Math.round(clamp01((T - a) / (b - a)) * text.length));

/* Camera keys [T, cx, cy, scale]: every move starts and ends at rest, scale in
   log space so zooms feel even. */
export type CamKey = [number, number, number, number];
export type Cam = { cx: number; cy: number; s: number };

export function camAt(keys: CamKey[], T: number): Cam {
  if (T <= keys[0][0]) return { cx: keys[0][1], cy: keys[0][2], s: keys[0][3] };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (T <= b[0]) {
      const p = ramp(T, a[0], b[0]);
      return {
        cx: lerp(a[1], b[1], p),
        cy: lerp(a[2], b[2], p),
        s: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), p)),
      };
    }
  }
  const z = keys[keys.length - 1];
  return { cx: z[1], cy: z[2], s: z[3] };
}

/* A point travelling through keys [T, x, y], easing between them. */
export function pathAt(keys: [number, number, number][], T: number) {
  if (T <= keys[0][0]) return { x: keys[0][1], y: keys[0][2] };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (T <= b[0]) {
      const p = ramp(T, a[0], b[0]);
      return { x: lerp(a[1], b[1], p), y: lerp(a[2], b[2], p) };
    }
  }
  const z = keys[keys.length - 1];
  return { x: z[1], y: z[2] };
}

/* Streaming, the way the homepage's Intelligent UI comparison streams: a
   piece pops up into place when the stream reaches it, text comes into focus,
   and bars grow from their baseline. Each is hidden until its moment. */
export function pop(T: number, at: number): CSSProperties | undefined {
  const p = ramp(T, at, at + 0.35, easeOut);
  if (p >= 1) return undefined;
  return {
    opacity: p,
    transform: `translateY(${((1 - p) * 10).toFixed(2)}px) scale(${(0.98 + 0.02 * p).toFixed(4)})`,
  };
}

export function focus(T: number, at: number): CSSProperties | undefined {
  if (T < at) return { opacity: 0 };
  const p = ramp(T, at, at + 0.9, easeOut);
  if (p >= 1) return undefined;
  return { opacity: 0.15 + 0.85 * p, filter: `blur(${((1 - p) * 2).toFixed(2)}px)` };
}

/* 0 to 1 as a bar grows in. */
export const grown = (T: number, at: number) => ramp(T, at, at + 0.6, easeOut);
