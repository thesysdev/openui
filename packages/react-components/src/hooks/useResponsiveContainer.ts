import { RefObject, useLayoutEffect, useState } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

export function getBreakpoint(width: number): Breakpoint {
  if (width < 480) return "mobile";
  if (width < 800) return "tablet";
  return "desktop";
}

export interface ContainerSize {
  width: number;
  height: number;
  breakpoint: Breakpoint;
}

/**
 * Continuously tracks a container's size via ResizeObserver and returns
 * width, height, and a breakpoint derived from the container width.
 *
 * Breakpoints: mobile (<480px) | tablet (480–800px) | desktop (>800px)
 */
export function useResponsiveContainer(containerRef: RefObject<HTMLElement | null>): ContainerSize {
  const [size, setSize] = useState<ContainerSize>({
    width: 0,
    height: 0,
    breakpoint: "mobile",
  });

  const [element, setElement] = useState<HTMLElement | null>(null);

  // Sync ref.current → state on every render so we pick up refs
  // populated after initial mount (portals, conditional renders, etc.)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const current = containerRef.current;
    if (current !== element) {
      setElement(current);
    }
  });

  useLayoutEffect(() => {
    if (!element) return;

    const updateSize = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      setSize((prev) => {
        if (prev.width === width && prev.height === height) return prev;
        return { width, height, breakpoint: getBreakpoint(width) };
      });
    };

    const rafUpdateSize = () => requestAnimationFrame(updateSize);

    const resizeObserver = new ResizeObserver(rafUpdateSize);
    resizeObserver.observe(element);
    updateSize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [element]);

  return size;
}
