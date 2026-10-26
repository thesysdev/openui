import { useState } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

/**
 * The layout size of an element, kept current by a ResizeObserver. Returns a
 * callback ref (not a ref object), so a chart that first renders its empty
 * state starts measuring as soon as its frame mounts.
 *
 * Measures in a layout effect, before the browser paints: the fallback size
 * never reaches the screen, so a chart never draws at a guessed width and then
 * stretches to its real one. Seeds from clientWidth/clientHeight, as
 * react-ui's `useContainerSize` does, so an ancestor `transform: scale()`
 * cannot skew the first frame. `measured` is false until then.
 */
export function useContainerSize<T extends HTMLElement>(fallbackWidth = 640, fallbackHeight = 0) {
  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState({
    width: fallbackWidth,
    height: fallbackHeight,
    measured: false,
  });
  useIsomorphicLayoutEffect(() => {
    if (!node) return;
    const update = (width: number, height: number) =>
      setSize((prev) =>
        prev.measured && prev.width === width && prev.height === height
          ? prev
          : { width, height, measured: true },
      );
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        update(Math.round(entry.contentRect.width), Math.round(entry.contentRect.height));
      }
    });
    observer.observe(node);
    update(node.clientWidth, node.clientHeight);
    return () => observer.disconnect();
  }, [node]);
  return [setNode, size] as const;
}
