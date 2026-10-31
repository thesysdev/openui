import { useEffect, useState } from "react";

export function useContainerSize(
  ref: React.RefObject<HTMLElement | null>,
  fixedWidth?: number | string,
  fixedHeight?: number | string,
): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const numericWidth = typeof fixedWidth === "number" ? fixedWidth : undefined;
  const numericHeight = typeof fixedHeight === "number" ? fixedHeight : undefined;

  useEffect(() => {
    if ((numericWidth && numericHeight) || !ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(ref.current);
    // Seed with LAYOUT px (clientWidth/clientHeight), not getBoundingClientRect
    // (VISUAL px). Under a CSS `transform: scale(...)` on an ancestor — e.g. the
    // slide canvas — getBoundingClientRect returns the scaled size, so the chart
    // would seed at the wrong (scaled) size for the frame before the observer
    // fires. clientWidth/clientHeight are transform-invariant and exclude
    // borders, matching the observer's contentRect for these borderless
    // containers, so the seed and steady-state size agree.
    setSize({
      width: ref.current.clientWidth,
      height: ref.current.clientHeight,
    });

    return () => observer.disconnect();
  }, [numericWidth, numericHeight, ref]);

  return {
    width: numericWidth ?? size.width,
    height: numericHeight ?? (typeof fixedHeight === "string" ? size.height : 0),
  };
}
