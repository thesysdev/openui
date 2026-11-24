"use client";

import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatedLabel } from "./AnimatedLabel";
import { styles as artifactStyles, names } from "./cloudArtifact.styles";
import { pendingLoaderNames, pendingLoaderStyles as styles } from "./pendingLoader.styles";
import { prefersReducedMotion, startPendingLoader } from "./pendingLoaderEngine";

export interface PendingLoaderProps {
  /**
   * Text for the note. Without it, the note steps through building a dashboard. A new label
   * drifts in. `Pending` passes what a dashboard being built is doing.
   */
  label?: string;
  /** The color the cards are tinted from, as any CSS color. Defaults to the text color. */
  color?: string;
  /** The cards' shapes: title bars, charts and numbers. Defaults to `color` at 8%. */
  shapeColor?: string;
  /** The cards' background. Defaults to `color` at 3%. */
  cardColor?: string;
  /** The cards' border. Defaults to `color` at 10%. */
  borderColor?: string;
  /**
   * Columns in the grid the cards sit on. With `rows`, it fixes the grid and so the drawing's
   * shape, which scales to fit. Without both, a portrait, square or landscape grid is picked to
   * suit the space. Rounded, from 2 to 24.
   */
  cols?: number;
  /** Rows in the grid the cards sit on. See `cols`. */
  rows?: number;
}

const NOTES = [
  "Reading your data",
  "Picking the right charts",
  "Crunching the numbers",
  "Arranging the layout",
  "Adding finishing touches",
];
const NOTE_EVERY = 2800;

/** `Pending`'s default: skeleton dashboard cards that rearrange under a note. */
export function PendingLoader({
  label,
  color,
  shapeColor,
  cardColor,
  borderColor,
  cols,
  rows,
}: PendingLoaderProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    return startPendingLoader(
      stage,
      cols !== undefined && rows !== undefined ? { cols, rows } : undefined,
    );
  }, [cols, rows]);

  // Only the colors given: the others are mixed from `color` in CSS.
  const style = {
    "--openui-pending-color": color,
    "--openui-pending-shape": shapeColor,
    "--openui-pending-card": cardColor,
    "--openui-pending-border": borderColor,
  } as CSSProperties;

  return (
    <div className={clsx(styles.root, names.pending)} style={style} role="status">
      <span className={styles.srOnly}>{label ?? "Preparing…"}</span>
      <div
        ref={stageRef}
        className={clsx(styles.stage, pendingLoaderNames.stage)}
        aria-hidden="true"
      />
      <div className={styles.overlay} aria-hidden="true">
        <div className={clsx(styles.note, pendingLoaderNames.note)}>
          <LoaderCircle
            className={clsx(artifactStyles.spinner, names.spinner)}
            size={14}
            aria-hidden
          />
          <NoteText label={label} />
        </div>
      </div>
    </div>
  );
}

/** `label`, or the next of `NOTES` every few seconds. */
function NoteText({ label }: { label?: string }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (label !== undefined || prefersReducedMotion()) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % NOTES.length), NOTE_EVERY);
    return () => clearInterval(timer);
  }, [label]);
  return <AnimatedLabel text={label ?? NOTES[index]!} />;
}
