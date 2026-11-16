"use client";

import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { styles as artifactStyles, names } from "./cloudArtifact.styles";
import { pendingLoaderNames, pendingLoaderStyles as styles } from "./pendingLoader.styles";
import { EASE_OUT, prefersReducedMotion, startPendingLoader } from "./pendingLoaderEngine";

export interface PendingLoaderProps {
  /** Fixed text for the note. Without it, the note steps through building a dashboard. */
  label?: string;
  /** The color the cards are tinted from, as any CSS color. Defaults to the text color. */
  color?: string;
  /** The cards' shapes: title bars, charts and numbers. Defaults to `color` at 8%. */
  shapeColor?: string;
  /** The cards' background. Defaults to `color` at 3%. */
  cardColor?: string;
  /** The cards' border. Defaults to `color` at 10%. */
  borderColor?: string;
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
}: PendingLoaderProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    return stage ? startPendingLoader(stage) : undefined;
  }, []);

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

/** `label`, or the next of `NOTES` every few seconds: the old line drifts up, the new one rises in. */
function NoteText({ label }: { label?: string }) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (label !== undefined || !el?.animate || prefersReducedMotion()) return;
    const timer = setInterval(() => {
      el.animate([{ opacity: 1 }, { opacity: 0, translate: "0 -5px" }], {
        duration: 200,
        fill: "forwards",
      })
        .finished.then(() => {
          setIndex((i) => (i + 1) % NOTES.length);
          el.getAnimations().forEach((animation) => animation.cancel());
          el.animate(
            [
              { opacity: 0, translate: "0 5px" },
              { opacity: 1, translate: "0 0" },
            ],
            {
              duration: 200,
              easing: EASE_OUT,
            },
          );
        })
        .catch(() => {});
    }, NOTE_EVERY);
    return () => clearInterval(timer);
  }, [label]);
  return <span ref={ref}>{label ?? NOTES[index]}</span>;
}
