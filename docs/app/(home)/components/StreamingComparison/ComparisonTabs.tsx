"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { StreamingComparison } from "./StreamingComparison";
import styles from "./StreamingComparison.module.css";
import type { ComparisonExample } from "./types";

export interface ComparisonTab {
  id: string;
  label: string;
  example: ComparisonExample;
}

const ROTATE_MS = 12_000;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const readReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/* The comparison with the homepage pill tabs floating over its bottom edge; picking a
   tab swaps in that example and streams it from the start. */
export function ComparisonTabs({ tabs, initial = 0 }: { tabs: ComparisonTab[]; initial?: number }) {
  const instanceId = useId();
  const hostRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(initial);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => true);
  const tab = tabs[active];

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.15,
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || hovered || focused || reducedMotion || tabs.length < 2) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      if (!document.hidden) {
        timer = setTimeout(() => setActive((index) => (index + 1) % tabs.length), ROTATE_MS);
      }
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [active, visible, hovered, focused, reducedMotion, tabs.length]);

  return (
    <div
      ref={hostRef}
      className={styles.tabsHost}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div
        role="tabpanel"
        id={`${instanceId}-comparison-${tab.id}`}
        aria-labelledby={`${instanceId}-comparison-tab-${tab.id}`}
        tabIndex={0}
      >
        {/* Keyed by tab, so switching remounts it and the stream restarts. */}
        <StreamingComparison key={tab.id} example={tab.example} />
      </div>
      <div className={styles.tabsBar}>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Examples"
          aria-orientation="horizontal"
        >
          {tabs.map((item, index) => (
            <button
              key={item.id}
              id={`${instanceId}-comparison-tab-${item.id}`}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-controls={`${instanceId}-comparison-${item.id}`}
              tabIndex={index === active ? 0 : -1}
              className={`${styles.tab} ${index === active ? styles.tabActive : ""}`.trim()}
              onClick={() => setActive(index)}
              onKeyDown={(event) => {
                let nextIndex: number;
                switch (event.key) {
                  case "ArrowLeft":
                    nextIndex = (index - 1 + tabs.length) % tabs.length;
                    break;
                  case "ArrowRight":
                    nextIndex = (index + 1) % tabs.length;
                    break;
                  case "Home":
                    nextIndex = 0;
                    break;
                  case "End":
                    nextIndex = tabs.length - 1;
                    break;
                  default:
                    return;
                }
                event.preventDefault();
                setActive(nextIndex);
                tabRefs.current[nextIndex]?.focus();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
