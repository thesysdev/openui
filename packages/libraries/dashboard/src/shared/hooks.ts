"use client";

import { useEffect, useLayoutEffect, useState } from "react";

/**
 * useLayoutEffect in the browser, useEffect on the server. React 18's server renderer warns
 * about every useLayoutEffect; these effects only measure or watch the DOM, so on the server
 * there is nothing for them to do either way.
 */
export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
/**
 * The rendered width of an element, kept current as it resizes. A callback ref, so an element that
 * mounts late (after an empty or streaming render) is still measured; measured before paint, so a
 * chart sized from it never draws at a placeholder size first and then jumps.
 */
export function useWidth<T extends HTMLElement = HTMLDivElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  useIsomorphicLayoutEffect(() => {
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);
  return [setEl, width] as const;
}
