"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import { StreamingComparison } from "./StreamingComparison";
import styles from "./StreamingComparison.module.css";
import type { ComparisonExample } from "./types";

export interface ComparisonTab {
  id: string;
  label: string;
  example: ComparisonExample;
}

/* The comparison with the homepage pill tabs floating over its bottom edge; picking a
   tab swaps in that example and streams it from the start. */
export function ComparisonTabs({
  tabs,
  initial = 0,
  leftStatic = false,
}: {
  tabs: ComparisonTab[];
  initial?: number;
  /* Forwarded: the "Without" answer rests finished instead of streaming. */
  leftStatic?: boolean;
}) {
  const instanceId = useId();
  const hostRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(initial);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
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

  return (
    <div
      ref={hostRef}
      className={styles.tabsHost}
      // The active tab's fill drives rotation; hold it while the comparison is
      // off screen or being read. The bar's own hover and focus pause in CSS.
      style={
        {
          "--tab-fill-play": !visible || hovered || focused ? "paused" : "running",
        } as CSSProperties
      }
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
        <StreamingComparison key={tab.id} example={tab.example} leftStatic={leftStatic} />
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
              // The active tab's fill (the only animation on these buttons) ran out.
              onAnimationEnd={() => setActive((index + 1) % tabs.length)}
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
