/** The renderer's easing for things that arrive. */
export const EASE_OUT = "cubic-bezier(0.2, 0.8, 0.2, 1)";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
