"use client";

import { StackChip, type StackChipItem } from "../../components/StackChip/StackChip";
import styles from "./CompatibilityDiagram.module.css";

/* One layer of the stack: two bands of logo cells drifting inward from either
 * side, with the space between them left for the centre column, which spans
 * every row and is drawn once by StackCentreColumn.
 *
 * The bands are decorative and repeat, so the real, named list lives in the
 * diagram's hidden summary, where each logo appears once under its layer.
 */

/* Cells in one pass of a band. The pass is rendered twice so the drift can
   restart without a seam, so half of it has to cover a band's width: at the
   diagram's widest that is (56rem - the centre) / 2, well under ten cells. */
const SEQUENCE_CELLS = 10;

/* A stable 0..1 from a seed. Deterministic, so the server and the client agree,
   and the logos still look unsorted rather than cycling in order. */
function hash(seed: number) {
  const seeded = Math.sin(seed) * 43758.5453;
  return seeded - Math.floor(seeded);
}

/* One pass of a band. Each side of each row gets its own, so the two bands are
   not mirror images of each other. */
function bandSequence(rowIndex: number, side: number, items: StackChipItem[]) {
  const picked: StackChipItem[] = [];

  for (let cell = 0; cell < SEQUENCE_CELLS; cell += 1) {
    let index = Math.floor(hash(rowIndex * 31.7 + side * 97.3 + cell * 13.1) * items.length);

    /* Step along rather than repeat the logo next door, including across the
       seam where the pass loops back on itself. Bounded, since a short enough
       list can leave nothing else to pick. */
    const neighbours = [picked[cell - 1], cell === SEQUENCE_CELLS - 1 ? picked[0] : undefined];
    for (let tries = 0; tries < items.length && neighbours.includes(items[index]); tries += 1) {
      index = (index + 1) % items.length;
    }

    picked.push(items[index]);
  }

  return picked;
}

export interface StackLayerRowProps {
  items: StackChipItem[];
  /* Row's place in the diagram, which seeds its bands. */
  rowIndex: number;
}

export function StackLayerRow({ items, rowIndex }: StackLayerRowProps) {

  const band = (side: number, direction: string) => {
    const sequence = bandSequence(rowIndex, side, items);

    return (
      <div aria-hidden="true" className={styles.rail}>
        <div className={`${styles.track} ${direction}`}>
          {[...sequence, ...sequence].map((item, position) => (
            <div className={styles.square} key={position}>
              <StackChip item={{ ...item, isBlurred: false }} iconOnly />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.row}>
      {band(0, styles.trackInFromLeft)}
      {/* The centre column's footprint. It is drawn over this, once for the
          whole diagram, so nothing is rendered here. */}
      <div className={styles.centreGap} />
      {band(1, styles.trackInFromRight)}
    </div>
  );
}
