import { useRef, useState, type ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "../../hooks";

export interface ScrollRegionProps {
  /** Names the region for screen readers while it scrolls, e.g. "Channels table". */
  label: string;
  /** Classes for the scroller; defaults to the kit's `kit-scroll`. */
  className?: string;
  children: ReactNode;
}

/**
 * A wide table's sideways scroller. While its content overflows (a phone, a
 * narrow card) it is a named, focusable region, so keyboard users can scroll
 * it with the arrow keys; when everything fits it is a plain box and adds no
 * tab stop.
 */
export function ScrollRegion({ label, className = "kit-scroll", children }: ScrollRegionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      {...(overflows ? { tabIndex: 0, role: "region", "aria-label": label } : {})}
    >
      {children}
    </div>
  );
}
