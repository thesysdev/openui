"use client";

import { useEffect, useState } from "react";
import { StackChip, type StackChipItem } from "../../components/StackChip/StackChip";
import styles from "./CompatibilityDiagram.module.css";

/* The whole centre of the diagram as one element: every layer's logo and title,
 * stacked, sitting over the drifting bands and lining up with their rows.
 *
 * One element rather than one per row, so the shadow it casts onto the bands is
 * a single shadow around a single box. Four stacked boxes each cast onto the
 * ones above and below them, which are the rest of this same column.
 */

/* How long a layer's logo holds before crossing to the next one. */
const SWAP_MS = 2200;

interface Layer {
  label: string;
  items: StackChipItem[];
}

function CentreEntry({ label, items, swapDelay }: Layer & { swapDelay: number }) {
  const [active, setActive] = useState(0);

  /* Held still for anyone who has asked for reduced motion, since it is
     content changing on its own. */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let interval = 0;
    const lead = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setActive((current) => (current + 1) % items.length);
      }, SWAP_MS);
    }, swapDelay);

    return () => {
      window.clearTimeout(lead);
      window.clearInterval(interval);
    };
  }, [items.length, swapDelay]);

  return (
    <div className={styles.centreRow}>
      {/* All of them are mounted and only one is shown, so changing logo is a
          cross-fade rather than an image load. */}
      <div aria-hidden="true" className={styles.centreIcon}>
        {items.map((item, index) => (
          <div
            className={styles.centreSlot}
            data-active={index === active || undefined}
            key={item.name}
          >
            <StackChip item={{ ...item, isBlurred: false }} iconOnly />
          </div>
        ))}
      </div>
      <span className={styles.centreText}>{label}</span>
    </div>
  );
}

export function StackCentreColumn({ layers }: { layers: Layer[] }) {
  return (
    <div className={styles.centre}>
      {layers.map((layer, index) => (
        <CentreEntry
          items={layer.items}
          key={layer.label}
          label={layer.label}
          /* Staggered, so the four titles do not all change logo together. */
          swapDelay={index * 550}
        />
      ))}
    </div>
  );
}
