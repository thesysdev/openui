"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { StackChip, type StackChipItem } from "../StackChip/StackChip";
import styles from "./LogoBubbles.module.css";

/* One logo sits in the middle as the hub; the rest orbit it on one ring,
   evenly spaced and all the same size, starting from twelve o'clock. */
const HUB_SIZE = 50;
const RING_SIZE = 32;
const RING_GAP = 6;
const RING_RADIUS = HUB_SIZE / 2 + RING_SIZE / 2 + RING_GAP;

/* Every few seconds the hub shrinks back into the ring and the next logo
   grows into the middle, swapping places. Columns start offset by `stagger`
   so they never swap together. */
const HOLD_MS = 5000;
const STAGGER_MS = 1250;

function slotPosition(slot: number, ringCount: number) {
  if (slot === 0) return { x: 0, y: 0, scale: 1 };
  const angle = -Math.PI / 2 + ((slot - 1) * 2 * Math.PI) / ringCount;
  return {
    x: Math.round(Math.cos(angle) * RING_RADIUS * 100) / 100,
    y: Math.round(Math.sin(angle) * RING_RADIUS * 100) / 100,
    scale: RING_SIZE / HUB_SIZE,
  };
}

export function LogoBubbles({ items, stagger = 0 }: { items: StackChipItem[]; stagger?: number }) {
  /* slots[i] is where item i sits: 0 is the hub, 1+ the ring. */
  const [{ slots, hub }, setLayout] = useState(() => ({
    slots: items.map((_, i) => i),
    hub: 0,
  }));
  /* Bumped on every click so the auto-rotation restarts its full hold
     instead of swapping the picked logo straight back out. */
  const [picks, setPicks] = useState(0);

  const bringToHub = (target: number) => {
    setLayout((prev) => {
      if (target === prev.hub) return prev;
      const swapped = [...prev.slots];
      [swapped[prev.hub], swapped[target]] = [prev.slots[target], prev.slots[prev.hub]];
      return { slots: swapped, hub: target };
    });
  };

  useEffect(() => {
    if (items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let interval: number | undefined;
    const start = window.setTimeout(
      () => {
        interval = window.setInterval(() => {
          if (document.hidden) return;
          setLayout((prev) => {
            const next = (prev.hub + 1) % prev.slots.length;
            const swapped = [...prev.slots];
            [swapped[prev.hub], swapped[next]] = [prev.slots[next], prev.slots[prev.hub]];
            return { slots: swapped, hub: next };
          });
        }, HOLD_MS);
      },
      picks === 0 ? stagger * STAGGER_MS : 0,
    );

    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [items.length, stagger, picks]);

  const ringCount = items.length - 1;

  return (
    <div className={styles.cluster} aria-hidden="true">
      {items.map((item, i) => {
        const { x, y, scale } = slotPosition(slots[i] ?? i, ringCount);
        const style = {
          "--stack-logo-size": `${HUB_SIZE}px`,
          "--stack-logo-glyph": `${Math.round(HUB_SIZE * 0.52)}px`,
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
        } as CSSProperties;

        return (
          <span
            key={item.name}
            className={`${styles.bubble} ${i === hub ? styles.bubbleHub : ""}`.trim()}
            style={style}
            title={item.name}
            onClick={() => {
              bringToHub(i);
              setPicks((n) => n + 1);
            }}
          >
            <span className={styles.face}>
              <StackChip item={item} iconOnly plain />
            </span>
          </span>
        );
      })}
    </div>
  );
}
